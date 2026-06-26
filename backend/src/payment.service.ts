import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SettingService } from './setting.service';
import { buildPromptPayPayload } from './payment/promptpay';
import QRCode from 'qrcode';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingService,
  ) {}

  async getResolvedPromptPay(branchId: string) {
    const [branch, globalId, globalName] = await Promise.all([
      this.prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true, name: true, promptpayId: true, promptpayName: true },
      }),
      this.settings.getOne('payment.promptpayId'),
      this.settings.getOne('payment.promptpayName'),
    ]);

    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found`);
    }

    const promptpayId = globalId?.trim() || '';
    const promptpayName = globalName?.trim() || branch.name;

    return {
      branchId: branch.id,
      branchName: branch.name,
      promptpayId,
      promptpayName,
      source: 'global',
    };
  }

  async createPromptPayPayload(branchId: string, amount: number) {
    const config = await this.getResolvedPromptPay(branchId);
    if (!config.promptpayId) {
      throw new BadRequestException(
        `Branch ${config.branchName} has no PromptPay target configured`,
      );
    }
    const qrPayload = buildPromptPayPayload({
      target: config.promptpayId,
      amount,
      merchantName: config.promptpayName,
      city: 'Bangkok',
    });
    return { ...config, qrPayload };
  }

  async buildQrPreview(qrPayload: string) {
    const qrImageDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 360,
      color: { dark: '#1f2937', light: '#ffffff' },
    });
    return { qrImageDataUrl };
  }

  async getOrderQr(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { branch: true, payment: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (!order.payment || order.payment.method !== 'QR') {
      throw new BadRequestException('This order is not using PromptPay QR');
    }
    if (!order.payment.qrPayload) {
      throw new BadRequestException('This order does not have QR payload');
    }
    const [preview, globalPromptpayId, globalPromptpayName, qrExpiryValue] =
      await Promise.all([
      this.buildQrPreview(order.payment.qrPayload),
      this.settings.getOne('payment.promptpayId'),
      this.settings.getOne('payment.promptpayName'),
      this.settings.getOne('payment.qrExpiryMinutes'),
    ]);
    const expiresAt = new Date(order.createdAt);
    expiresAt.setMinutes(
      expiresAt.getMinutes() + Math.max(1, Number(qrExpiryValue || '15')),
    );

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.totalAmount,
      paymentStatus: order.payment.status,
      promptpayId: globalPromptpayId || '',
      promptpayName: globalPromptpayName || order.branch.name,
      qrPayload: order.payment.qrPayload,
      qrImageDataUrl: preview.qrImageDataUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
