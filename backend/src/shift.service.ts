import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { JwtPayload } from './auth/jwt-payload';

/**
 * Cash-shift management. A branch has at most one OPEN shift at a time.
 * Opening a shift records the starting cash drawer; closing it computes
 * expected cash from CASH-paid orders during the shift window and records
 * the variance against the actual count.
 */
@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  private assertBranchAccess(user: JwtPayload | null, branchId: string) {
    if (!user) throw new ForbiddenException('Authentication required');
    if (user.role === 'ADMIN') return;
    if (
      (user.role === 'MANAGER' || user.role === 'STAFF') &&
      user.branchId === branchId
    ) {
      return;
    }
    throw new ForbiddenException('You can only access your own branch');
  }

  async getCurrent(branchId: string, user: JwtPayload | null) {
    this.assertBranchAccess(user, branchId);
    const shift = await this.prisma.shift.findFirst({
      where: { branchId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
    if (!shift) return null;

    // Fetch live orders since shift opened
    const cashOrders = await this.prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: shift.openedAt },
        payment: { method: 'CASH', status: { not: 'REFUNDED' } },
        status: { not: 'CANCELLED' },
      },
      select: { totalAmount: true },
    });
    const cashOrdersTotal = cashOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    const allOrders = await this.prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: shift.openedAt },
        status: { not: 'CANCELLED' },
      },
      select: { totalAmount: true },
    });
    const totalRevenue = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const ordersCount = allOrders.length;

    return {
      ...shift,
      liveCashOrdersTotal: cashOrdersTotal,
      liveTotalRevenue: totalRevenue,
      liveOrdersCount: ordersCount,
    };
  }

  async getHistory(branchId: string, user: JwtPayload | null, limit = 30) {
    this.assertBranchAccess(user, branchId);
    return this.prisma.shift.findMany({
      where: { branchId },
      orderBy: { openedAt: 'desc' },
      take: limit,
    });
  }

  async open(
    branchId: string,
    data: { openingCash: number; openedBy?: string; note?: string; openingStock?: { ingredientId: string; actualQty: number }[] },
    user: JwtPayload | null,
  ) {
    this.assertBranchAccess(user, branchId);

    const existing = await this.prisma.shift.findFirst({
      where: { branchId, status: 'OPEN' },
    });
    if (existing) {
      throw new BadRequestException(
        'A shift is already open for this branch — close it before opening a new one',
      );
    }
    if (data.openingCash < 0) {
      throw new BadRequestException('Opening cash cannot be negative');
    }

    return this.prisma.$transaction(async (tx) => {
      let openingStockSnapshot: any[] = [];

      if (data.openingStock && data.openingStock.length > 0) {
        for (const item of data.openingStock) {
          let inventory = await tx.inventory.findUnique({
            where: { branchId_ingredientId: { branchId, ingredientId: item.ingredientId } },
            include: { ingredient: true },
          });

          if (!inventory) {
            inventory = await tx.inventory.create({
              data: { branchId, ingredientId: item.ingredientId, quantity: 0 },
              include: { ingredient: true },
            });
          }

          const systemQty = inventory.quantity;
          const actualQty = item.actualQty;
          const variance = actualQty - systemQty;
          const costPerUnit = inventory.ingredient.costPerUnit || 0;

          openingStockSnapshot.push({
            ingredientId: item.ingredientId,
            name: inventory.ingredient.name,
            unit: inventory.ingredient.unit,
            systemQty,
            actualQty,
            costPerUnit,
          });

          // Log adjustment transaction if counted starting stock differs from system stock
          if (variance !== 0) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: actualQty },
            });

            await tx.inventoryTransaction.create({
              data: {
                branchId,
                ingredientId: item.ingredientId,
                type: 'ADJUSTMENT',
                quantity: variance,
                unitCost: costPerUnit,
                totalCost: Math.abs(variance) * costPerUnit,
                note: 'Shift Opening Count Alignment',
                createdBy: user?.sub || null,
              },
            });
          }
        }
      }

      return tx.shift.create({
        data: {
          branchId,
          openingCash: data.openingCash,
          openedBy: data.openedBy || user?.sub || null,
          note: data.note,
          status: 'OPEN',
          openingStock: openingStockSnapshot.length > 0 ? openingStockSnapshot : undefined,
        },
      });
    });
  }

  async close(
    shiftId: string,
    data: { closingCash: number; closedBy?: string; note?: string; closingStock?: { ingredientId: string; actualQty: number; wasteQty: number; wasteReason: string }[] },
    user: JwtPayload | null,
  ) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status === 'CLOSED') {
      throw new BadRequestException('Shift is already closed');
    }
    this.assertBranchAccess(user, shift.branchId);
    if (data.closingCash < 0) {
      throw new BadRequestException('Closing cash cannot be negative');
    }

    const closedAt = new Date();

    // Aggregate CASH-paid orders during the shift window.
    const cashOrders = await this.prisma.order.findMany({
      where: {
        branchId: shift.branchId,
        createdAt: { gte: shift.openedAt, lte: closedAt },
        payment: { method: 'CASH', status: { not: 'REFUNDED' } },
        status: { not: 'CANCELLED' },
      },
      select: { totalAmount: true },
    });
    const cashOrdersTotal = cashOrders.reduce(
      (s, o) => s + (o.totalAmount || 0),
      0,
    );

    const allOrders = await this.prisma.order.findMany({
      where: {
        branchId: shift.branchId,
        createdAt: { gte: shift.openedAt, lte: closedAt },
        status: { not: 'CANCELLED' },
      },
      select: { totalAmount: true },
    });
    const totalRevenue = allOrders.reduce(
      (s, o) => s + (o.totalAmount || 0),
      0,
    );
    const ordersCount = allOrders.length;

    const expectedCash = (shift.openingCash || 0) + cashOrdersTotal;
    const variance = data.closingCash - expectedCash;

    return this.prisma.$transaction(async (tx) => {
      let closingStockSnapshot: any[] = [];
      let totalWasteCost = 0;
      let totalVarianceCost = 0;

      if (data.closingStock && data.closingStock.length > 0) {
        for (const item of data.closingStock) {
          const inventory = await tx.inventory.findUnique({
            where: { branchId_ingredientId: { branchId: shift.branchId, ingredientId: item.ingredientId } },
            include: { ingredient: true },
          });

          if (!inventory) continue;

          const expectedQty = inventory.quantity;
          const actualQty = item.actualQty;
          const wasteQty = item.wasteQty || 0;
          const costPerUnit = inventory.ingredient.costPerUnit || 0;

          // 1. Log reported waste
          if (wasteQty > 0) {
            const wasteCostVal = wasteQty * costPerUnit;
            totalWasteCost += wasteCostVal;

            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: { decrement: wasteQty } },
            });

            await tx.inventoryTransaction.create({
              data: {
                branchId: shift.branchId,
                ingredientId: item.ingredientId,
                type: 'WASTE',
                quantity: -wasteQty,
                unitCost: costPerUnit,
                totalCost: wasteCostVal,
                note: `Closing Waste: ${item.wasteReason || 'General waste'}`,
                createdBy: user?.sub || null,
              },
            });
          }

          // 2. Calculate unaccounted variance
          // Variance = actualQty - (expectedQty - wasteQty)
          // Since we just decremented wasteQty, the expected quantity for variance calculation is (expectedQty - wasteQty)
          const expectedAfterWaste = expectedQty - wasteQty;
          const unaccountedVariance = actualQty - expectedAfterWaste;
          const varianceCostVal = unaccountedVariance * costPerUnit;
          totalVarianceCost += varianceCostVal;

          // 3. Log alignment transaction to sync to counted actualQty
          if (unaccountedVariance !== 0) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: actualQty },
            });

            await tx.inventoryTransaction.create({
              data: {
                branchId: shift.branchId,
                ingredientId: item.ingredientId,
                type: 'ADJUSTMENT',
                quantity: unaccountedVariance,
                unitCost: costPerUnit,
                totalCost: Math.abs(varianceCostVal),
                note: 'Shift Closing Discrepancy Alignment',
                createdBy: user?.sub || null,
              },
            });
          }

          closingStockSnapshot.push({
            ingredientId: item.ingredientId,
            name: inventory.ingredient.name,
            unit: inventory.ingredient.unit,
            expectedQty,
            actualQty,
            wasteQty,
            wasteReason: item.wasteReason,
            variance: unaccountedVariance,
            costPerUnit,
          });
        }
      }

      // Calculate performance score
      let varianceDeduction = 0;
      let wasteDeduction = 0;
      const absVarianceCost = Math.abs(totalVarianceCost);

      if (totalRevenue > 0) {
        varianceDeduction = Math.min(50, (absVarianceCost / totalRevenue) * 100 * 5); // 5 points per 1% of revenue
        wasteDeduction = Math.min(50, (totalWasteCost / totalRevenue) * 100 * 2); // 2 points per 1% of revenue
      } else {
        // Fallback to total opening stock cost if no sales occurred
        let totalOpeningStockCost = 0;
        if (shift.openingStock) {
          const opStock = shift.openingStock as any[];
          totalOpeningStockCost = opStock.reduce((sum, item) => sum + (item.actualQty * item.costPerUnit), 0);
        }

        if (totalOpeningStockCost > 0) {
          varianceDeduction = Math.min(50, (absVarianceCost / totalOpeningStockCost) * 100 * 5);
          wasteDeduction = Math.min(50, (totalWasteCost / totalOpeningStockCost) * 100 * 2);
        } else {
          varianceDeduction = absVarianceCost > 0 ? 10 : 0;
          wasteDeduction = totalWasteCost > 0 ? 5 : 0;
        }
      }

      const score = Math.max(0, 100 - varianceDeduction - wasteDeduction);
      let grade = 'A+';
      if (score >= 95) grade = 'A+';
      else if (score >= 90) grade = 'A';
      else if (score >= 80) grade = 'B';
      else if (score >= 70) grade = 'C';
      else if (score >= 60) grade = 'D';
      else grade = 'F';

      return tx.shift.update({
        where: { id: shiftId },
        data: {
          closedAt,
          closedBy: data.closedBy || user?.sub || null,
          closingCash: data.closingCash,
          cashOrdersTotal,
          expectedCash,
          variance,
          ordersCount,
          totalRevenue,
          note: data.note ?? shift.note,
          status: 'CLOSED',
          closingStock: closingStockSnapshot.length > 0 ? closingStockSnapshot : undefined,
          stockVarianceCost: totalVarianceCost,
          wasteCost: totalWasteCost,
          stockPerformanceScore: score,
          stockPerformanceGrade: grade,
        },
      });
    });
  }
}
