import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { OrderGateway } from './order.gateway';
import { InventoryService } from './inventory.service';
import { UserService } from './user.service';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import type { JwtPayload } from './auth/jwt-payload';
import { PaymentService } from './payment.service';

export interface CreateOrderDto {
  branchId: string;
  userId?: string;
  customerUid?: string;
  customerName?: string;
  totalAmount: number;
  fulfillmentType?: string;
  note?: string;
  scheduledAt?: string | Date;
  paymentMethod?: string;
  platform?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    price: number;
    optionsPrice?: number;
    productName?: string;
    name?: string;
    customization?: any;
    selectedOptions?: any;
  }>;
}

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private gateway: OrderGateway,
    private inventory: InventoryService,
    private userService: UserService,
    private paymentService: PaymentService,
  ) {}

  // ─── Order Include ──────────────────────────────────────────────────────
  private orderInclude = {
    items: { include: { product: true } },
    branch: true,
    payment: true,
  };

  private async recordPaidOrderSideEffects(order: {
    id: string;
    userId: string | null;
    branchId: string;
    totalAmount: number;
    orderNo: string;
  }) {
    if (order.userId) {
      const pointsEarned = Math.floor(order.totalAmount / 10);
      if (pointsEarned > 0) {
        await this.userService.updatePoints(
          order.userId,
          pointsEarned,
          `ได้แต้มจากออเดอร์ #${order.orderNo}`,
          order.id,
        );
      }
    }

    const existingCashflow = await this.prisma.cashflowTransaction.findFirst({
      where: { referenceId: order.id, category: 'SALES', type: 'INCOME' },
      select: { id: true },
    });
    if (!existingCashflow) {
      await this.prisma.cashflowTransaction.create({
        data: {
          branchId: order.branchId,
          type: 'INCOME',
          category: 'SALES',
          amount: order.totalAmount,
          referenceId: order.id,
          note: `รายได้จากออเดอร์ #${order.orderNo}`,
        },
      });
    }

    // Record platform fee (1 Baht per ordered item)
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: order.id },
      select: { quantity: true },
    });
    const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const platformFeeCategory = 'PLATFORM_FEE';
    const existingPlatformFee = await this.prisma.cashflowTransaction.findFirst({
      where: { referenceId: order.id, category: platformFeeCategory, type: 'EXPENSE' },
      select: { id: true },
    });
    if (!existingPlatformFee && totalItemsCount > 0) {
      await this.prisma.cashflowTransaction.create({
        data: {
          branchId: order.branchId,
          type: 'EXPENSE',
          category: platformFeeCategory,
          amount: totalItemsCount * 1.0,
          referenceId: order.id,
          note: `ค่าธรรมเนียมแพลตฟอร์มสำหรับออเดอร์ #${order.orderNo} (จำนวน ${totalItemsCount} รายการ)`,
        },
      });
    }
  }

  // ─── Create Order ───────────────────────────────────────────────────────
  // orderNo + queueNo are computed inside the same transaction as the insert
  // so two concurrent createOrder calls cannot share the same number.
  async createOrder(data: CreateOrderDto, actor?: JwtPayload) {
    const {
      branchId,
      userId,
      customerUid,
      customerName,
      items,
      totalAmount,
      fulfillmentType,
      note,
      scheduledAt,
      paymentMethod,
    } = data;

    try {
      const method = paymentMethod || 'CASH';
      const isImmediateCashSale = method === 'CASH';
      const initialOrderStatus: OrderStatus = isImmediateCashSale ? 'PAID' : 'PENDING';
      const initialPaymentStatus: PaymentStatus = isImmediateCashSale ? 'PAID' : 'UNPAID';
      const qrMeta =
        method === 'QR'
          ? await this.paymentService.createPromptPayPayload(branchId, totalAmount)
          : null;
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const prefix = `ORD-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

      const order = await this.prisma.$transaction(async (tx) => {
        const [globalDaily, branchDaily] = await Promise.all([
          tx.order.count({ where: { createdAt: { gte: startOfDay } } }),
          tx.order.count({
            where: { branchId, createdAt: { gte: startOfDay } },
          }),
        ]);

        const orderNo = `${prefix}-${(globalDaily + 1).toString().padStart(4, '0')}`;
        const queueNo = branchDaily + 1;

        return tx.order.create({
          data: {
            orderNo,
            branchId,
            userId: userId || null,
            customerUid: customerUid || 'walk-in',
            customerName: customerName || null,
            totalAmount,
            fulfillmentType: fulfillmentType || 'PICKUP',
            platform: data.platform || 'STORE',
            note: note || null,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            queueNo,
            status: initialOrderStatus,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice || item.price,
                optionsPrice: item.optionsPrice || 0,
                price: item.price * item.quantity,
                productName: item.productName || item.name || null,
                customization:
                  (item.customization as Prisma.InputJsonValue) ?? null,
                selectedOptions:
                  (item.selectedOptions as Prisma.InputJsonValue) ?? null,
              })),
            },
            payment: {
              create: {
                amount: totalAmount,
                status: initialPaymentStatus,
                method,
                qrPayload: qrMeta?.qrPayload || null,
                paidAt: initialPaymentStatus === 'PAID' ? new Date() : null,
              },
            },
          },
          include: this.orderInclude,
        });
      });

      if (initialPaymentStatus === 'PAID') {
        await this.recordPaidOrderSideEffects(order);
        // Immediate in-store cash sale deduction
        try {
          const result = await this.inventory.deductInventoryForOrder(order.id);
          if (!result.alreadyDeducted && result.lowStockAlerts) {
            this.gateway.notifyInventoryAlert(branchId, result.lowStockAlerts);
          }
        } catch (e: unknown) {
          console.warn(`Initial inventory deduction failed for ${order.id}:`, e);
        }
      }

      // Notify Branch Real-time
      this.gateway.notifyNewOrder(branchId, order);

      // Audit Log
      await this.prisma.auditLog.create({
        data: {
          action: 'CREATE_ORDER',
          entity: 'Order',
          entityId: order.id,
          userId: actor?.sub,
          details: {
            customerUid,
            totalAmount,
            orderNo: order.orderNo,
            actorRole: actor?.role,
          },
        },
      });

      return qrMeta
        ? {
            ...order,
            paymentQr: {
              promptpayId: qrMeta.promptpayId,
              promptpayName: qrMeta.promptpayName,
              qrPayload: qrMeta.qrPayload,
              ...(await this.paymentService.buildQrPreview(qrMeta.qrPayload)),
            },
          }
        : order;
    } catch (error) {
      console.error('Order creation error:', error);
      throw new BadRequestException('Could not create order.');
    }
  }

  // ─── Update Order Status ────────────────────────────────────────────────
  async updateOrderStatus(
    orderId: string,
    status: string,
    metadata?: { riderName?: string; riderPhone?: string; qcNote?: string },
    actor?: JwtPayload,
  ) {
    // STAFF / MANAGER tokens are scoped to a single branch.
    if (
      (actor?.role === 'STAFF' || actor?.role === 'MANAGER') &&
      actor.branchId
    ) {
      const existing = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { branchId: true },
      });
      if (!existing) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }
      if (existing.branchId !== actor.branchId) {
        throw new ForbiddenException(
          'Branch staff cannot modify orders from another branch',
        );
      }
    }

    const data: Prisma.OrderUpdateInput = {
      status: status as OrderStatus,
    };
    if (metadata?.riderName) data.riderName = metadata.riderName;
    if (metadata?.riderPhone) data.riderPhone = metadata.riderPhone;
    if (metadata?.qcNote) data.qcNote = metadata.qcNote;

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data,
      include: this.orderInclude,
    });

    // Cut stock at the first transition that signals "drink prepared".
    // deductInventoryForOrder is idempotent — safe to call on every status flip.
    if (
      status === 'READY_FOR_QC' ||
      status === 'READY' ||
      status === 'READY_FOR_PICKUP'
    ) {
      try {
        const result = await this.inventory.deductInventoryForOrder(orderId);
        if (!result.alreadyDeducted && result.lowStockAlerts) {
          this.gateway.notifyInventoryAlert(
            order.branchId,
            result.lowStockAlerts,
          );
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.error(`Inventory deduction failed for ${orderId}:`, msg);
        this.gateway.server
          .to(`branch-${order.branchId}`)
          .emit('inventory-error', { orderId, message: msg });
      }
    }

    // Notify clients
    this.gateway.notifyUpdateOrder(order.branchId, order);
    return order;
  }

  // ─── Update Payment Status ──────────────────────────────────────────────
  async updatePaymentStatus(
    orderId: string,
    data: { status: string; method?: string; transactionId?: string },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      select: { id: true, status: true, method: true },
    });
    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    const nextStatus = data.status as PaymentStatus;
    const wasAlreadyPaid = payment.status === 'PAID';
    await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: nextStatus,
        method: data.method,
        transactionId: data.transactionId,
        paidAt: nextStatus === 'PAID' ? new Date() : null,
      },
    });

    if (nextStatus === 'PAID' && !wasAlreadyPaid) {
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
      await this.recordPaidOrderSideEffects(order);
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude,
    });
    if (!updatedOrder) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    this.gateway.notifyUpdateOrder(updatedOrder.branchId, updatedOrder);
    return updatedOrder;
  }

  // ─── Refund Order ───────────────────────────────────────────────────────
  /**
   * Refund an order. Sets order.status = CANCELLED, payment.status = REFUNDED,
   * and writes a balancing EXPENSE row in cashflow so daily P&L stays correct.
   * STAFF can only refund orders from their own branch.
   */
  async refundOrder(
    orderId: string,
    data: { reason: string; amount?: number },
    actor?: JwtPayload,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (
      (actor?.role === 'STAFF' || actor?.role === 'MANAGER') &&
      actor.branchId !== order.branchId
    ) {
      throw new ForbiddenException(
        'Branch staff cannot refund orders from another branch',
      );
    }
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }
    if (order.payment?.status === 'REFUNDED') {
      throw new BadRequestException('Order is already refunded');
    }

    const refundAmount =
      data.amount && data.amount > 0 ? data.amount : order.totalAmount;
    const reason = data.reason?.trim() || 'No reason provided';

    const updated = await this.prisma.$transaction(async (tx) => {
      if (order.payment) {
        await tx.payment.update({
          where: { orderId: order.id },
          data: { status: 'REFUNDED' },
        });
      }
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          note: order.note
            ? `${order.note}\n[REFUND] ${reason}`
            : `[REFUND] ${reason}`,
        },
        include: this.orderInclude,
      });
      // Balancing expense — only if the order had been paid (and thus
      // appeared as INCOME in cashflow).
      if (order.payment?.status === 'PAID') {
        await tx.cashflowTransaction.create({
          data: {
            branchId: order.branchId,
            type: 'EXPENSE',
            category: 'REFUND',
            amount: refundAmount,
            referenceId: order.id,
            note: `คืนเงินออเดอร์ #${order.orderNo} · ${reason}`,
          },
        });

        // Reverse the platform fee if it was charged
        const platformFeeCategory = 'PLATFORM_FEE';
        const originalPlatformFee = await tx.cashflowTransaction.findFirst({
          where: { referenceId: order.id, category: platformFeeCategory, type: 'EXPENSE' },
        });
        if (originalPlatformFee) {
          await tx.cashflowTransaction.create({
            data: {
              branchId: order.branchId,
              type: 'INCOME',
              category: platformFeeCategory,
              amount: originalPlatformFee.amount,
              referenceId: order.id,
              note: `คืนค่าธรรมเนียมแพลตฟอร์มสำหรับออเดอร์ #${order.orderNo} (ยกเลิกออเดอร์)`,
            },
          });
        }
      }
      return updated;
    });

    this.gateway.notifyUpdateOrder(updated.branchId, updated);
    return updated;
  }

  // ─── Get All Orders (with filters) ──────────────────────────────────────
  async getAllOrders(filters?: {
    branchId?: string;
    status?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    paymentMethod?: string;
    fulfillmentType?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.OrderWhereInput = {};
    if (filters?.branchId) where.branchId = filters.branchId;
    if (filters?.status) {
      const statuses = filters.status
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as OrderStatus[];
      if (statuses.length === 1) where.status = statuses[0];
      else if (statuses.length > 1) where.status = { in: statuses };
    }
    if (filters?.date) {
      const d = new Date(filters.date);
      where.createdAt = { gte: d, lt: new Date(d.getTime() + 86400000) };
    } else if (filters?.dateFrom && filters?.dateTo) {
      const start = new Date(filters.dateFrom);
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(filters.dateTo);
      const end = new Date(filters.dateTo);
      if (isDateOnly) {
        end.setHours(23, 59, 59, 999);
      }
      where.createdAt = { gte: start, lte: end };
    } else if (filters?.dateFrom) {
      where.createdAt = { gte: new Date(filters.dateFrom) };
    } else if (filters?.dateTo) {
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(filters.dateTo);
      const end = new Date(filters.dateTo);
      if (isDateOnly) {
        end.setHours(23, 59, 59, 999);
      }
      where.createdAt = { lte: end };
    }
    if (filters?.search) {
      where.OR = [
        { orderNo: { contains: filters.search } },
        { customerName: { contains: filters.search } },
        { customerUid: { contains: filters.search } },
      ];
    }
    if (filters?.paymentMethod) {
      const methods = filters.paymentMethod
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      if (methods.length > 0) {
        where.payment = { method: { in: methods } };
      }
    }
    if (filters?.fulfillmentType) {
      const types = filters.fulfillmentType
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
      if (types.length === 1) where.fulfillmentType = types[0];
      else if (types.length > 1) where.fulfillmentType = { in: types };
    }

    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(10000, Math.max(1, filters?.limit || 25));
    const sort = filters?.sort || 'newest';
    const orderBy: Prisma.OrderOrderByWithRelationInput =
      sort === 'oldest'
        ? { createdAt: 'asc' }
        : sort === 'amount-desc'
          ? { totalAmount: 'desc' }
          : sort === 'amount-asc'
            ? { totalAmount: 'asc' }
            : { createdAt: 'desc' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: this.orderInclude,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ─── Get Order by ID ────────────────────────────────────────────────────
  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async getPaymentQr(orderId: string) {
    return this.paymentService.getOrderQr(orderId);
  }

  // ─── Recent Orders ─────────────────────────────────────────────────────
  async getRecentOrders(limit = 10) {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: this.orderInclude,
    });
  }

  // ─── Customer Order History ─────────────────────────────────────────────
  async getCustomerOrders(customerUid: string) {
    return this.prisma.order.findMany({
      where: { customerUid },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: this.orderInclude,
    });
  }

  async getCustomerOrdersFor(customerUid: string, me: JwtPayload) {
    if (me.role === 'ADMIN') return this.getCustomerOrders(customerUid);

    if (me.role !== 'CUSTOMER') {
      throw new ForbiddenException('Only customers can access this order history');
    }

    const ownsUid =
      customerUid === me.sub ||
      !!(await this.prisma.authProvider.findFirst({
        where: { userId: me.sub, providerId: customerUid },
        select: { id: true },
      }));

    if (!ownsUid) {
      throw new ForbiddenException('Cannot access another customer order history');
    }

    return this.prisma.order.findMany({
      where: {
        OR: [{ userId: me.sub }, { customerUid }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: this.orderInclude,
    });
  }

  // ─── Order Stats ────────────────────────────────────────────────────────
  async getOrderStats(branchId?: string) {
    const where = branchId ? { branchId } : {};
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const [total, todayCount, todayRevenue, byStatus, totalRevenue] =
      await Promise.all([
        this.prisma.order.count({ where }),
        this.prisma.order.count({
          where: { ...where, createdAt: { gte: startOfDay } },
        }),
        this.prisma.order.aggregate({
          where: { ...where, createdAt: { gte: startOfDay } },
          _sum: { totalAmount: true },
        }),
        this.prisma.order.groupBy({ by: ['status'], where, _count: true }),
        this.prisma.order.aggregate({ where, _sum: { totalAmount: true } }),
      ]);

    return {
      total,
      todayCount,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    };
  }

  // ─── Global Stats (with deltas) ────────────────────────────────────────
  async getGlobalStats() {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalOrders,
      todayOrders,
      yesterdayOrders,
      totalAgg,
      todayAgg,
      yesterdayAgg,
      uniqueCustomers,
      branches,
      newUsersThisMonth,
      newUsersLastMonth,
      todayCupsAgg,
      yesterdayCupsAgg,
      totalCupsAgg,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.order.count({
        where: { createdAt: { gte: startOfYesterday, lt: startOfToday } },
      }),
      this.prisma.order.aggregate({ _sum: { totalAmount: true } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startOfYesterday, lt: startOfToday } },
      }),
      this.prisma.order.groupBy({ by: ['customerUid'] }),
      this.prisma.branch.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfThisMonth } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
      }),
      this.prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: { order: { createdAt: { gte: startOfToday } } },
      }),
      this.prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: { order: { createdAt: { gte: startOfYesterday, lt: startOfToday } } },
      }),
      this.prisma.orderItem.aggregate({
        _sum: { quantity: true },
      }),
    ]);

    const todayRevenue = todayAgg._sum.totalAmount || 0;
    const yesterdayRevenue = yesterdayAgg._sum.totalAmount || 0;
    const todayCups = todayCupsAgg._sum.quantity || 0;
    const yesterdayCups = yesterdayCupsAgg._sum.quantity || 0;
    const totalCups = totalCupsAgg._sum.quantity || 0;
    const cupsPerOrder = todayOrders > 0 ? Number((todayCups / todayOrders).toFixed(2)) : 0;

    const pct = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

    return {
      revenue: totalAgg._sum.totalAmount || 0,
      todayRevenue,
      revenueDelta: pct(todayRevenue, yesterdayRevenue),
      totalOrders,
      todayOrders,
      ordersDelta: pct(todayOrders, yesterdayOrders),
      todayCups,
      totalCups,
      cupsDelta: pct(todayCups, yesterdayCups),
      cupsPerOrder,
      customers: uniqueCustomers.length,
      newCustomersThisMonth: newUsersThisMonth,
      customersDelta: pct(newUsersThisMonth, newUsersLastMonth),
      branches,
    };
  }

  // ─── Top Products ──────────────────────────────────────────────────────
  async getTopProducts(opts: {
    branchId?: string;
    days?: number;
    limit?: number;
    sortBy?: 'quantity' | 'revenue';
  } = {}) {
    const { branchId, days = 30, limit = 5, sortBy = 'quantity' } = opts;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Prisma.OrderItemWhereInput = {
      order: {
        createdAt: { gte: since },
        ...(branchId ? { branchId } : {}),
      },
    };

    const orderBy = sortBy === 'revenue'
      ? { _sum: { price: 'desc' as const } }
      : { _sum: { quantity: 'desc' as const } };

    const groups = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: { quantity: true, price: true },
      orderBy,
      take: limit,
    });

    if (groups.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: groups.map((g) => g.productId) } },
      select: { id: true, name: true, imageUrl: true, price: true },
    });

    return groups.map((g) => {
      const p = products.find((x) => x.id === g.productId);
      return {
        productId: g.productId,
        name: p?.name || 'Unknown',
        imageUrl: p?.imageUrl || null,
        price: p?.price || 0,
        sold: g._sum.quantity || 0,
        revenue: g._sum.price || 0,
      };
    });
  }

  // ─── Revenue Trend (daily series for charts) ───────────────────────────
  async getRevenueTrend(days = 7, branchId?: string) {
    const buckets: { date: string; revenue: number; orders: number }[] = [];
    const now = new Date();

    // Format a Date as YYYY-MM-DD using LOCAL components — toISOString() would
    // shift to UTC and drop a day for late-evening timestamps in +07:00.
    const localDateString = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const tasks: Promise<void>[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const idx = days - 1 - i;
      tasks.push(
        Promise.all([
          this.prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: {
              createdAt: { gte: start, lt: end },
              ...(branchId ? { branchId } : {}),
            },
          }),
          this.prisma.order.count({
            where: {
              createdAt: { gte: start, lt: end },
              ...(branchId ? { branchId } : {}),
            },
          }),
        ]).then(([agg, count]) => {
          buckets[idx] = {
            date: localDateString(start),
            revenue: agg._sum.totalAmount || 0,
            orders: count,
          };
        }),
      );
    }
    await Promise.all(tasks);
    return buckets;
  }

  // ─── Cancel Order ───────────────────────────────────────────────────────
  async cancelOrder(orderId: string, reason?: string, actor?: JwtPayload) {
    const order = await this.getOrderById(orderId);

    // Customers may only cancel their own orders. Staff/Admin may cancel any.
    if (actor && actor.role === 'CUSTOMER') {
      if (order.userId && order.userId !== actor.sub) {
        throw new ForbiddenException(
          "Cannot cancel another customer's order",
        );
      }
    }
    // Staff are bound to their own branch.
    if (actor && actor.role === 'STAFF') {
      if (actor.branchId && actor.branchId !== order.branchId) {
        throw new ForbiddenException(
          'Staff cannot cancel orders from other branches',
        );
      }
    }

    if (['COMPLETED', 'PICKED_UP', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('Cannot cancel this order.');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: this.orderInclude,
    });

    // Refund if paid
    if (order.payment?.status === 'PAID') {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId },
          data: { status: 'REFUNDED' },
        });

        // Record balancing refund expense
        await tx.cashflowTransaction.create({
          data: {
            branchId: order.branchId,
            type: 'EXPENSE',
            category: 'REFUND',
            amount: order.totalAmount,
            referenceId: order.id,
            note: `คืนเงินออเดอร์ #${order.orderNo} · ยกเลิกออเดอร์ (ระบบ/ลูกค้า)`,
          },
        });

        // Reverse the platform fee if it was charged
        const platformFeeCategory = 'PLATFORM_FEE';
        const originalPlatformFee = await tx.cashflowTransaction.findFirst({
          where: { referenceId: order.id, category: platformFeeCategory, type: 'EXPENSE' },
        });
        if (originalPlatformFee) {
          await tx.cashflowTransaction.create({
            data: {
              branchId: order.branchId,
              type: 'INCOME',
              category: platformFeeCategory,
              amount: originalPlatformFee.amount,
              referenceId: order.id,
              note: `คืนค่าธรรมเนียมแพลตฟอร์มสำหรับออเดอร์ #${order.orderNo} (ยกเลิกออเดอร์)`,
            },
          });
        }
      });
    }

    this.gateway.notifyUpdateOrder(updated.branchId, updated);
    await this.prisma.auditLog.create({
      data: {
        action: 'CANCEL_ORDER',
        entity: 'Order',
        entityId: orderId,
        userId: actor?.sub,
        details: { reason, actorRole: actor?.role },
      },
    });

    return updated;
  }

}
