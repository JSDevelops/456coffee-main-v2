import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from './auth/jwt-payload';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(search?: string) {
    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      include: {
        authProviders: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        authProviders: true,
        addresses: true,
        pointHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { branch: true },
        },
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async createUser(data: { name?: string; phone?: string; email?: string }) {
    const name = data.name?.trim();
    const phone = data.phone?.trim();
    const email = data.email?.trim();

    if (!name && !phone && !email) {
      throw new BadRequestException('Name, phone, or email is required');
    }

    try {
      return await this.prisma.user.create({
        data: {
          name: name || phone || email || 'ลูกค้าหน้าร้าน',
          phone: phone || null,
          email: email || null,
          role: 'CUSTOMER',
        },
        include: {
          authProviders: true,
          _count: { select: { orders: true } },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Phone or email already exists');
      }
      throw error;
    }
  }

  async updatePoints(
    id: string,
    delta: number,
    reason?: string,
    orderId?: string,
    actor?: JwtPayload,
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        points: { increment: delta },
      },
    });

    // Record point transaction
    await this.prisma.pointTransaction.create({
      data: {
        userId: id,
        delta,
        reason: reason || 'Point adjustment',
        orderId,
      },
    });

    // Audit Log for point adjustment
    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE_POINTS',
        entity: 'User',
        entityId: id,
        userId: actor?.sub,
        details: {
          delta,
          reason,
          orderId,
          newPoints: user.points,
          actorRole: actor?.role,
        },
      },
    });

    return user;
  }

  async setRole(id: string, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }
}
