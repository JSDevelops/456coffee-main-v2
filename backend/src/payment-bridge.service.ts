import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { verifyPassword, hashPassword } from './auth/password';
import type { JwtPayload } from './auth/jwt-payload';
import { OrderService } from './order.service';
import { detectBankCode, extractAmount, isLikelyIncomingPayment } from './payment/parser';
import type {
  IncomingPaymentDto,
  UpdatePaymentDeviceDto,
  UpsertPaymentDeviceDto,
} from './dto/payment-bridge.dto';
import { SettingService } from './setting.service';

@Injectable()
export class PaymentBridgeService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private orders: OrderService,
    private settings: SettingService,
  ) {}

  private sanitizeDevice(device: {
    id: string;
    branchId: string;
    name: string;
    username: string;
    isActive: boolean;
    lastSeenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: device.id,
      branchId: device.branchId,
      name: device.name,
      username: device.username,
      isActive: device.isActive,
      lastSeenAt: device.lastSeenAt?.toISOString() || null,
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
    };
  }

  async login(username: string, password: string) {
    const device = await this.prisma.paymentDevice.findUnique({
      where: { username: username.trim() },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!device || !device.isActive || !verifyPassword(password, device.passwordHash)) {
      throw new UnauthorizedException('Invalid app credentials');
    }

    await this.prisma.paymentDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: `app-${device.id}`,
      role: 'APP',
      deviceId: device.id,
    };

    return {
      success: true,
      token: this.jwt.sign(payload),
      user: {
        id: device.id,
        name: device.name,
        role: 'APP',
        branchId: device.branchId,
        branchName: device.branch.name,
        username: device.username,
      },
    };
  }

  async verify(user: JwtPayload | null) {
    if (!user?.deviceId || user.role !== 'APP') {
      throw new UnauthorizedException('Invalid app token');
    }
    const device = await this.prisma.paymentDevice.findUnique({
      where: { id: user.deviceId },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!device || !device.isActive) {
      throw new UnauthorizedException('App device is inactive');
    }

    await this.prisma.paymentDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      success: true,
      user: {
        id: device.id,
        name: device.name,
        role: 'APP',
        branchId: device.branchId,
        branchName: device.branch.name,
        username: device.username,
      },
    };
  }

  async test(user: JwtPayload | null) {
    const verified = await this.verify(user);
    return {
      ...verified,
      ok: true,
      serverTime: new Date().toISOString(),
    };
  }

  async listDevices(branchId: string) {
    const devices = await this.prisma.paymentDevice.findMany({
      where: { branchId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
    return devices.map((device) => this.sanitizeDevice(device));
  }

  async getDeviceById(deviceId: string) {
    return this.prisma.paymentDevice.findUnique({ where: { id: deviceId } });
  }

  async createDevice(branchId: string, data: UpsertPaymentDeviceDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

    const created = await this.prisma.paymentDevice.create({
      data: {
        branchId,
        name: data.name.trim(),
        username: data.username.trim(),
        passwordHash: hashPassword(data.password),
        isActive: data.isActive ?? true,
      },
    });

    return this.sanitizeDevice(created);
  }

  async updateDevice(deviceId: string, data: UpdatePaymentDeviceDto) {
    const device = await this.prisma.paymentDevice.findUnique({
      where: { id: deviceId },
    });
    if (!device) throw new NotFoundException(`Payment device ${deviceId} not found`);

    const updated = await this.prisma.paymentDevice.update({
      where: { id: deviceId },
      data: {
        name: data.name?.trim(),
        username: data.username?.trim(),
        passwordHash: data.password ? hashPassword(data.password) : undefined,
        isActive: data.isActive,
      },
    });

    return this.sanitizeDevice(updated);
  }

  async deleteDevice(deviceId: string) {
    const device = await this.prisma.paymentDevice.findUnique({
      where: { id: deviceId },
    });
    if (!device) throw new NotFoundException(`Payment device ${deviceId} not found`);
    await this.prisma.paymentDevice.delete({ where: { id: deviceId } });
    return { success: true };
  }

  async handleIncoming(user: JwtPayload | null, data: IncomingPaymentDto) {
    if (!user?.deviceId || user.role !== 'APP') {
      throw new UnauthorizedException('Invalid app token');
    }
    const message = data.message.trim();
    const timestamp = new Date(data.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      throw new BadRequestException('Invalid timestamp');
    }

    const bankCode = detectBankCode({
      sender: data.sender,
      packageName: data.packageName,
      message,
    });
    const isIncome = isLikelyIncomingPayment(message);
    const amount = extractAmount(message);

    const event = await this.prisma.incomingPaymentEvent.create({
      data: {
        branchId: null,
        deviceId: user.deviceId || null,
        source: data.source || 'sms',
        sender: data.sender.trim(),
        packageName: data.packageName?.trim() || null,
        message,
        rawTimestamp: timestamp,
        amount,
        bankCode: bankCode || null,
        status: !isIncome ? 'IGNORED' : 'RECEIVED',
        note: !isIncome ? 'Message does not look like incoming payment' : null,
      },
    });

    if (!isIncome) {
      return {
        success: true,
        matched: false,
        ignored: true,
        transaction: { id: event.id, amount, bankCode },
      };
    }

    if (!amount || amount <= 0) {
      await this.prisma.incomingPaymentEvent.update({
        where: { id: event.id },
        data: { status: 'UNMATCHED', note: 'Could not extract amount from message' },
      });
      return {
        success: true,
        matched: false,
        transaction: { id: event.id, amount: null, bankCode },
      };
    }

    const matchWindowMinutes = Math.max(
      5,
      Number((await this.settings.getOne('payment.matchWindowMinutes')) || '180'),
    );
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - matchWindowMinutes);

    const candidates = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: cutoff },
        totalAmount: {
          gte: amount - 0.01,
          lte: amount + 0.01,
        },
        status: 'PENDING',
        payment: {
          is: {
            status: 'UNPAID',
            method: { in: ['QR', 'TRANSFER'] },
          },
        },
      },
      include: { payment: true },
      orderBy: { createdAt: 'asc' },
    });

    if (candidates.length === 0) {
      await this.prisma.incomingPaymentEvent.update({
        where: { id: event.id },
        data: { status: 'UNMATCHED', note: 'No pending order matched this amount' },
      });
      return {
        success: true,
        matched: false,
        transaction: { id: event.id, amount, bankCode },
      };
    }

    if (candidates.length > 1) {
      await this.prisma.incomingPaymentEvent.update({
        where: { id: event.id },
        data: {
          status: 'AMBIGUOUS',
          note: `Found ${candidates.length} pending orders with the same amount`,
        },
      });
      return {
        success: true,
        matched: false,
        ambiguous: true,
        transaction: { id: event.id, amount, bankCode },
      };
    }

    const order = candidates[0];
    await this.orders.updatePaymentStatus(order.id, {
      status: 'PAID',
      method: order.payment?.method || 'QR',
      transactionId: event.id,
    });

    const updatedEvent = await this.prisma.incomingPaymentEvent.update({
      where: { id: event.id },
      data: {
        branchId: order.branchId,
        status: 'MATCHED',
        matchedOrderId: order.id,
        note: `Matched order ${order.orderNo}`,
      },
    });

    return {
      success: true,
      matched: true,
      transaction: {
        id: updatedEvent.id,
        amount,
        bankCode,
        orderId: order.id,
        orderNo: order.orderNo,
      },
    };
  }
}
