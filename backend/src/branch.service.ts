import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface BranchDetailDto {
  name?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
  openTime?: string;
  closeTime?: string;
  phone?: string;
  promptpayId?: string;
  promptpayName?: string;
  imageUrl?: string;
}

export interface CreateManagerDto {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  lineUid?: string;
  pin?: string;
  isActive?: boolean;
}

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  // ─── Branch CRUD ───────────────────────────────────────────────────────────

  async getAllBranches() {
    return this.prisma.branch.findMany({
      include: {
        _count: { select: { orders: true, inventory: true } },
        managers: { orderBy: { createdAt: 'asc' } },
        paymentDevices: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            branchId: true,
            name: true,
            username: true,
            isActive: true,
            lastSeenAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicBranches() {
    return this.prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
        phone: true,
        imageUrl: true,
        createdAt: true,
        // Removed _count: { orders } — counting ALL historical orders is expensive;
        // the POS/LIFF only uses this list for branch selection.
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  async getBranchById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        managers: { orderBy: { createdAt: 'asc' } },
        paymentDevices: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            branchId: true,
            name: true,
            username: true,
            isActive: true,
            lastSeenAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { orders: true, inventory: true } },
      },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }

  async getPublicBranchById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
        phone: true,
        imageUrl: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }

  async createBranch(data: BranchDetailDto & { name: string }) {
    return this.prisma.branch.create({
      data: {
        name: data.name,
        location: data.location,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        isOpen: data.isOpen ?? true,
        openTime: data.openTime,
        closeTime: data.closeTime,
        phone: data.phone,
        promptpayId: data.promptpayId,
        promptpayName: data.promptpayName,
        imageUrl: data.imageUrl,
      },
      include: {
        managers: true,
        paymentDevices: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            branchId: true,
            name: true,
            username: true,
            isActive: true,
            lastSeenAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { orders: true, inventory: true } },
      },
    });
  }

  async updateBranch(id: string, data: BranchDetailDto) {
    await this.getBranchById(id);
    return this.prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        isOpen: data.isOpen,
        openTime: data.openTime,
        closeTime: data.closeTime,
        phone: data.phone,
        promptpayId: data.promptpayId,
        promptpayName: data.promptpayName,
        imageUrl: data.imageUrl,
      },
      include: {
        managers: true,
        paymentDevices: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            branchId: true,
            name: true,
            username: true,
            isActive: true,
            lastSeenAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { orders: true, inventory: true } },
      },
    });
  }

  async toggleBranchOpen(id: string) {
    const branch = await this.getBranchById(id);
    return this.prisma.branch.update({
      where: { id },
      data: { isOpen: !branch.isOpen },
      include: {
        managers: true,
        paymentDevices: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            branchId: true,
            name: true,
            username: true,
            isActive: true,
            lastSeenAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { orders: true, inventory: true } },
      },
    });
  }

  async deleteBranch(id: string) {
    await this.getBranchById(id);
    // Delete related managers first
    await this.prisma.branchManager.deleteMany({ where: { branchId: id } });
    await this.prisma.paymentDevice.deleteMany({ where: { branchId: id } });
    return this.prisma.branch.delete({ where: { id } });
  }

  // ─── Branch Staff CRUD ────────────────────────────────────────────────────

  async getManagers(branchId: string) {
    await this.getBranchById(branchId);
    return this.prisma.branchManager.findMany({
      where: { branchId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getManagerById(managerId: string) {
    return this.prisma.branchManager.findUnique({
      where: { id: managerId },
    });
  }

  async addManager(branchId: string, data: CreateManagerDto) {
    await this.getBranchById(branchId);
    if (data.pin) {
      await this.assertPinUnique(branchId, data.pin);
    }
    return this.prisma.branchManager.create({
      data: {
        branchId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role ?? 'CASHIER',
        lineUid: data.lineUid,
        pin: data.pin || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateManager(managerId: string, data: Partial<CreateManagerDto>) {
    const mgr = await this.prisma.branchManager.findUnique({
      where: { id: managerId },
    });
    if (!mgr) throw new NotFoundException(`Manager ${managerId} not found`);
    if (data.pin && data.pin !== mgr.pin) {
      await this.assertPinUnique(mgr.branchId, data.pin, managerId);
    }
    return this.prisma.branchManager.update({
      where: { id: managerId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        lineUid: data.lineUid,
        pin: data.pin === undefined ? undefined : data.pin || null,
        isActive: data.isActive,
      },
    });
  }

  async deleteManager(managerId: string) {
    const mgr = await this.prisma.branchManager.findUnique({
      where: { id: managerId },
    });
    if (!mgr) throw new NotFoundException(`Manager ${managerId} not found`);
    return this.prisma.branchManager.delete({ where: { id: managerId } });
  }

  /** PIN must be unique per branch among ACTIVE staff. */
  private async assertPinUnique(
    branchId: string,
    pin: string,
    excludeId?: string,
  ) {
    if (!pin) return;
    const clash = await this.prisma.branchManager.findFirst({
      where: {
        branchId,
        pin,
        isActive: true,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (clash) {
      throw new BadRequestException(
        `PIN ${pin} is already used by another active staff at this branch`,
      );
    }
  }

  // ─── Branch Dashboard ──────────────────────────────────────────────────────

  async getBranchDashboard(branchId: string) {
    await this.getBranchById(branchId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalOrders,
      todayOrders,
      revenueRaw,
      todayRevenueRaw,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      this.prisma.order.count({ where: { branchId } }),
      this.prisma.order.count({
        where: {
          branchId,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { branchId, status: { in: ['PICKED_UP', 'READY'] } },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          branchId,
          status: { in: ['PICKED_UP', 'READY'] },
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.order.findMany({
        where: { branchId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: { include: { product: true } } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { branchId } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Get product names for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const topProductsWithNames = topProducts.map((tp) => ({
      productId: tp.productId,
      name: products.find((p) => p.id === tp.productId)?.name || 'Unknown',
      totalSold: tp._sum.quantity || 0,
    }));

    return {
      totalOrders,
      todayOrders,
      totalRevenue: revenueRaw._sum.totalAmount || 0,
      todayRevenue: todayRevenueRaw._sum.totalAmount || 0,
      recentOrders,
      topProducts: topProductsWithNames,
    };
  }

  // ─── Branch Menu (with per-branch availability overrides) ─────────────────

  /**
   * Return the catalog as seen by this branch. Items globally HIDDEN are
   * filtered out. AVAILABLE / OUT_OF_STOCK can be locally overridden via
   * BranchProductStatus.
   */
  async getBranchMenu(branchId: string) {
    await this.getBranchById(branchId);
    const [products, overrides] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: { not: 'HIDDEN' } },
        include: {
          category: true,
          optionGroups: { include: { options: true }, orderBy: { sortOrder: 'asc' } },
          recipes: { include: { ingredient: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { sortOrder: 'desc' },
      }),
      this.prisma.branchProductStatus.findMany({ where: { branchId } }),
    ]);

    const overrideMap = new Map(overrides.map((o) => [o.productId, o]));
    return products.map((p) => {
      const override = overrideMap.get(p.id);
      return {
        ...p,
        // Effective status the branch / POS should respect.
        effectiveStatus: override?.status || p.status,
        globalStatus: p.status,
        branchOverride: override
          ? {
              status: override.status,
              reason: override.reason,
              updatedAt: override.updatedAt,
            }
          : null,
      };
    });
  }

  async setBranchProductStatus(
    branchId: string,
    productId: string,
    status: string,
    actor?: { sub?: string },
    reason?: string,
  ) {
    await this.getBranchById(branchId);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (product.status === 'HIDDEN') {
      throw new BadRequestException(
        'This product is hidden globally — ask admin to unhide before toggling at branch',
      );
    }
    if (status !== 'AVAILABLE' && status !== 'OUT_OF_STOCK') {
      throw new BadRequestException('Status must be AVAILABLE or OUT_OF_STOCK');
    }
    return this.prisma.branchProductStatus.upsert({
      where: {
        branchId_productId: { branchId, productId },
      },
      update: { status, reason: reason || null, updatedBy: actor?.sub || null },
      create: {
        branchId,
        productId,
        status,
        reason: reason || null,
        updatedBy: actor?.sub || null,
      },
    });
  }

  async clearBranchProductStatus(branchId: string, productId: string) {
    return this.prisma.branchProductStatus
      .delete({
        where: { branchId_productId: { branchId, productId } },
      })
      .catch(() => null);
  }

  // ─── Branch Orders (POS live board) ────────────────────────────────────────
  // Only fetches today's non-terminal orders so the payload stays small.
  // Completed / cancelled orders are excluded from the live board; the
  // manager history endpoint serves historical queries instead.
  async getBranchOrders(branchId: string, limit = 100) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const activeStatuses = ['PENDING', 'PAID', 'PREPARING', 'READY_FOR_QC', 'READY_FOR_PICKUP', 'READY', 'DISPATCHED'];
    return this.prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: startOfDay },
        status: { in: activeStatuses as any },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        items: { include: { product: true } },
        payment: true,
      },
    });
  }


  // ─── Manager-grade dashboard (today snapshot) ──────────────────────────────

  async getManagerDashboard(branchId: string) {
    await this.getBranchById(branchId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [todayOrders, recentOrders, topProductsRaw, lowStock, payments] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { branchId, createdAt: { gte: startOfDay, lt: endOfDay } },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            platform: true,
          },
        }),
        this.prisma.order.findMany({
          where: { branchId },
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: { items: true, payment: true },
        }),
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              branchId,
              createdAt: { gte: startOfDay, lt: endOfDay },
              status: { not: 'CANCELLED' },
            },
          },
          _sum: { quantity: true, price: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 6,
        }),
        this.prisma.inventory.findMany({
          where: { branchId },
          include: { ingredient: true },
        }),
        this.prisma.payment.findMany({
          where: {
            order: {
              branchId,
              createdAt: { gte: startOfDay, lt: endOfDay },
              status: { not: 'CANCELLED' },
            },
            status: 'PAID',
          },
          select: { method: true, amount: true },
        }),
      ]);

    const completedToday = todayOrders.filter(
      (o) => o.status !== 'CANCELLED',
    );
    const liveStatuses = [
      'PENDING',
      'PAID',
      'PREPARING',
      'READY_FOR_QC',
      'READY_FOR_PICKUP',
      'DISPATCHED',
    ];
    const liveOrders = todayOrders.filter((o) =>
      liveStatuses.includes(o.status as string),
    ).length;

    const todayRevenue = completedToday.reduce(
      (s, o) => s + (o.totalAmount || 0),
      0,
    );
    const avgTicket =
      completedToday.length > 0 ? todayRevenue / completedToday.length : 0;

    // Hourly buckets (24)
    const hourly: Array<{ hour: number; orders: number; revenue: number }> =
      Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));
    for (const o of completedToday) {
      const h = new Date(o.createdAt).getHours();
      hourly[h].orders += 1;
      hourly[h].revenue += o.totalAmount || 0;
    }

    // Status breakdown (today, all)
    const statusBreakdown: Record<string, number> = {};
    for (const o of todayOrders) {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
    }

    // Platform breakdown (today, completed)
    const platformBreakdown: Record<string, { orders: number; revenue: number }> =
      {};
    for (const o of completedToday) {
      const p = (o.platform as string) || 'STORE';
      if (!platformBreakdown[p]) platformBreakdown[p] = { orders: 0, revenue: 0 };
      platformBreakdown[p].orders += 1;
      platformBreakdown[p].revenue += o.totalAmount || 0;
    }

    // Payment breakdown (today, paid only)
    const paymentBreakdown: Record<string, { count: number; amount: number }> =
      {};
    for (const p of payments) {
      const m = p.method || 'CASH';
      if (!paymentBreakdown[m]) paymentBreakdown[m] = { count: 0, amount: 0 };
      paymentBreakdown[m].count += 1;
      paymentBreakdown[m].amount += p.amount || 0;
    }

    // Top products (resolve names)
    const productIds = topProductsRaw.map((tp) => tp.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, imageUrl: true, price: true },
    });
    const topProducts = topProductsRaw.map((tp) => {
      const p = products.find((x) => x.id === tp.productId);
      return {
        productId: tp.productId,
        name: p?.name || 'Unknown',
        imageUrl: p?.imageUrl || null,
        soldQty: tp._sum.quantity || 0,
        revenue: tp._sum.price || 0,
      };
    });

    // Low-stock items
    const lowStockItems = lowStock
      .filter((inv) => inv.quantity <= (inv.lowStockThreshold || 0))
      .map((inv) => ({
        ingredientId: inv.ingredientId,
        name: inv.ingredient.name,
        unit: inv.ingredient.unit,
        quantity: inv.quantity,
        threshold: inv.lowStockThreshold,
      }))
      .sort((a, b) => a.quantity / (a.threshold || 1) - b.quantity / (b.threshold || 1))
      .slice(0, 8);

    return {
      kpis: {
        ordersToday: completedToday.length,
        revenueToday: todayRevenue,
        avgTicket,
        liveOrders,
        cancelledToday: todayOrders.length - completedToday.length,
      },
      hourly,
      statusBreakdown,
      platformBreakdown,
      paymentBreakdown,
      topProducts,
      lowStockItems,
      recentOrders,
    };
  }

  // ─── Manager: paginated order history with filters ─────────────────────────

  async getManagerHistory(
    branchId: string,
    opts: {
      from?: string;
      to?: string;
      search?: string;
      status?: string;
      platform?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    await this.getBranchById(branchId);
    const page = Math.max(1, opts.page || 1);
    const pageSize = Math.min(100, Math.max(5, opts.pageSize || 20));

    const where: any = { branchId };
    if (opts.from || opts.to) {
      where.createdAt = {};
      if (opts.from) where.createdAt.gte = new Date(opts.from);
      if (opts.to) where.createdAt.lte = new Date(opts.to);
    }
    if (opts.status) where.status = opts.status;
    if (opts.platform) where.platform = opts.platform;
    if (opts.search) {
      const s = opts.search;
      where.OR = [
        { orderNo: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: { include: { product: true } },
          payment: true,
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      rows,
    };
  }

  // ─── Legacy: Products (used by other parts) ────────────────────────────────

  async getProducts() {
    return this.prisma.product.findMany({
      include: { recipes: { include: { ingredient: true } } },
    });
  }

  async getBranchStats(branchId: string) {
    const totalOrders = await this.prisma.order.count({ where: { branchId } });
    const revenueRaw = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { branchId, status: { in: ['PICKED_UP', 'READY'] } },
    });
    return {
      totalOrders,
      revenue: revenueRaw._sum.totalAmount || 0,
    };
  }
}
