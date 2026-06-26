import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateTransactionDto {
  branchId: string;
  ingredientId: string;
  type: string; // STOCK_IN | STOCK_OUT | WASTE | ADJUSTMENT | ORDER_DEDUCTION
  quantity: number;
  unitCost?: number;
  referenceId?: string;
  note?: string;
  createdBy?: string;
}

@Injectable()
export class InventoryTransactionService {
  constructor(private prisma: PrismaService) {}

  // ─── Record Transaction ───────────────────────────────────────────
  async createTransaction(data: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get current ingredient and inventory
      const ingredient = await tx.ingredient.findUnique({
        where: { id: data.ingredientId },
      });
      if (!ingredient) throw new BadRequestException('Ingredient not found');

      let inventory = await tx.inventory.findUnique({
        where: {
          branchId_ingredientId: {
            branchId: data.branchId,
            ingredientId: data.ingredientId,
          },
        },
      });

      // Auto-create inventory record if it doesn't exist
      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            branchId: data.branchId,
            ingredientId: data.ingredientId,
            quantity: 0,
          },
        });
      }

      // 2. Determine quantity multiplier (IN is positive, OUT is negative)
      const isDeduction = ['STOCK_OUT', 'WASTE', 'ORDER_DEDUCTION'].includes(data.type);
      const absQuantity = Math.abs(data.quantity);
      const netQuantity = isDeduction ? -absQuantity : absQuantity;
      
      const newQuantity = inventory.quantity + netQuantity;
      if (newQuantity < 0) {
        throw new BadRequestException(`Insufficient stock for ${ingredient.name}`);
      }

      // 3. Determine Unit Cost
      // Use the provided cost, or fallback to the current average cost of the ingredient
      const unitCost = data.unitCost ?? ingredient.costPerUnit;
      const totalCost = absQuantity * unitCost;

      // Update moving average cost for STOCK_IN.
      // Skip if newQuantity is non-positive (would divide by zero / produce
      // negative average cost) or if we're stocking in for the first time.
      if (
        data.type === 'STOCK_IN' &&
        inventory.quantity >= 0 &&
        newQuantity > 0
      ) {
        const currentTotalValue = inventory.quantity * ingredient.costPerUnit;
        const newTotalValue = currentTotalValue + totalCost;
        const newAverageCost = newTotalValue / newQuantity;

        await tx.ingredient.update({
          where: { id: ingredient.id },
          data: { costPerUnit: newAverageCost },
        });
      }

      // 4. Update Inventory
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity },
      });

      // 5. Log Transaction
      const inventoryTx = await tx.inventoryTransaction.create({
        data: {
          branchId: data.branchId,
          ingredientId: data.ingredientId,
          type: data.type,
          quantity: netQuantity,
          unitCost,
          totalCost,
          referenceId: data.referenceId,
          note: data.note,
          createdBy: data.createdBy,
        },
      });

      // 6. Auto-record to Cashflow if STOCK_IN
      if (data.type === 'STOCK_IN' && totalCost > 0) {
        await tx.cashflowTransaction.create({
          data: {
            branchId: data.branchId,
            type: 'EXPENSE',
            category: 'INGREDIENTS',
            amount: totalCost,
            referenceId: inventoryTx.id,
            note: `ซื้อวัตถุดิบ: ${ingredient.name} (${absQuantity} ${ingredient.unit})`,
            createdBy: data.createdBy,
          }
        });
      }

      return inventoryTx;
    });
  }

  // ─── Get Transactions ──────────────────────────────────────────────
  async getTransactions(filters: { branchId?: string; ingredientId?: string; type?: string; startDate?: string; endDate?: string }) {
    const where: Prisma.InventoryTransactionWhereInput = {};
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.ingredientId) where.ingredientId = filters.ingredientId;
    if (filters.type) where.type = filters.type;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    return this.prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredient: true,
      },
    });
  }
}
