import { ForbiddenException } from '@nestjs/common';
import { OrderService } from './order.service';
import type { PrismaService } from './prisma.service';
import type { OrderGateway } from './order.gateway';
import type { InventoryService } from './inventory.service';
import type { UserService } from './user.service';

function fixtureOrder(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'o1',
    orderNo: 'ORD-1',
    branchId: 'b1',
    userId: 'u1',
    customerUid: 'u1',
    totalAmount: 100,
    status: 'PAID',
    items: [],
    payment: { status: 'UNPAID' },
    ...over,
  } as any;
}

function makeService(prisma: any) {
  const gateway = { notifyUpdateOrder: jest.fn() } as unknown as OrderGateway;
  const inventory = {} as InventoryService;
  const userService = {} as UserService;
  return new OrderService(
    prisma as PrismaService,
    gateway,
    inventory,
    userService,
  );
}

describe('OrderService.cancelOrder ownership', () => {
  it('lets a customer cancel their own order', async () => {
    const order = fixtureOrder();
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        update: jest.fn().mockResolvedValue({ ...order, status: 'CANCELLED' }),
      },
      payment: { update: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    const svc = makeService(prisma);
    const updated = await svc.cancelOrder('o1', 'changed mind', {
      sub: 'u1',
      role: 'CUSTOMER',
    });
    expect(updated.status).toBe('CANCELLED');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it("forbids a customer cancelling someone else's order", async () => {
    const order = fixtureOrder({ userId: 'u1' });
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(order) },
    };
    const svc = makeService(prisma);
    await expect(
      svc.cancelOrder('o1', undefined, { sub: 'u2', role: 'CUSTOMER' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('forbids STAFF from cancelling another branch’s order', async () => {
    const order = fixtureOrder({ branchId: 'b1' });
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(order) },
    };
    const svc = makeService(prisma);
    await expect(
      svc.cancelOrder('o1', undefined, {
        sub: 'branch-b2',
        role: 'STAFF',
        branchId: 'b2',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets ADMIN cancel any order', async () => {
    const order = fixtureOrder({ branchId: 'b9', userId: 'u-other' });
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        update: jest.fn().mockResolvedValue({ ...order, status: 'CANCELLED' }),
      },
      payment: { update: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    const svc = makeService(prisma);
    const updated = await svc.cancelOrder('o1', undefined, {
      sub: 'system-admin',
      role: 'ADMIN',
    });
    expect(updated.status).toBe('CANCELLED');
  });
});
