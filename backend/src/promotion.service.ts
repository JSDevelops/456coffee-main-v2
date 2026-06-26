import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PromotionType } from '@prisma/client';

export interface CartItemForPromo {
  productId: string;
  quantity: number;
  unitPrice: number;  // price per item (including options)
}

export interface CalculateResult {
  discountAmount: number;
  freeItems?: { productId: string; quantity: number }[];
  description: string;
}

export interface CreatePromotionDto {
  branchId?: string;
  name: string;
  description?: string;
  code?: string;
  type: PromotionType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;  // cap for PERCENT type
  productIds?: string[];
  buyQty?: number;
  getQty?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  isActive?: boolean;
}

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  /** รายการโปรโมชั่นทั้งหมด (ตามสาขา + global) */
  async findAll(branchId?: string) {
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [
          { branchId: null },
          ...(branchId ? [{ branchId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** รายการทั้งหมด (Admin: ไม่กรอง isActive) */
  async findAllAdmin(branchId?: string) {
    return this.prisma.promotion.findMany({
      where: branchId ? { OR: [{ branchId: null }, { branchId }] } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  async findByCode(code: string) {
    const promo = await this.prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!promo) throw new NotFoundException('Coupon code not found');
    if (!promo.isActive) throw new BadRequestException('Promotion is inactive');
    this.assertNotExpired(promo);
    this.assertUsageLimit(promo);
    return promo;
  }

  async create(dto: CreatePromotionDto, createdBy?: string) {
    if (dto.code) dto.code = dto.code.toUpperCase();
    return this.prisma.promotion.create({
      data: {
        ...dto,
        productIds: dto.productIds ?? [],
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdBy,
      },
    });
  }

  async update(id: string, dto: Partial<CreatePromotionDto>) {
    await this.findOne(id);
    if (dto.code) dto.code = dto.code.toUpperCase();
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.promotion.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Core discount calculation ──────────────────────────────────────────────

  /** คำนวณส่วนลดจาก promotionId และ cart items */
  async calculate(
    promotionId: string,
    cart: CartItemForPromo[],
    orderSubtotal: number,
  ): Promise<CalculateResult> {
    const promo = await this.findOne(promotionId);
    if (!promo.isActive) throw new BadRequestException('Promotion is inactive');
    this.assertNotExpired(promo);
    this.assertUsageLimit(promo);

    if (orderSubtotal < promo.minOrderAmount) {
      throw new BadRequestException(
        `ยอดขั้นต่ำ ฿${promo.minOrderAmount.toLocaleString()} (ยอดปัจจุบัน ฿${orderSubtotal.toLocaleString()})`,
      );
    }

    return this.computeDiscount(promo, cart, orderSubtotal);
  }

  /** คำนวณส่วนลดจาก coupon code */
  async calculateByCode(
    code: string,
    cart: CartItemForPromo[],
    orderSubtotal: number,
  ): Promise<CalculateResult & { promotionId: string }> {
    const promo = await this.findByCode(code);
    if (orderSubtotal < promo.minOrderAmount) {
      throw new BadRequestException(
        `ยอดขั้นต่ำ ฿${promo.minOrderAmount.toLocaleString()} (ยอดปัจจุบัน ฿${orderSubtotal.toLocaleString()})`,
      );
    }
    const result = this.computeDiscount(promo, cart, orderSubtotal);
    return { ...result, promotionId: promo.id };
  }

  private computeDiscount(
    promo: any,
    cart: CartItemForPromo[],
    orderSubtotal: number,
  ): CalculateResult {
    switch (promo.type as PromotionType) {
      case PromotionType.PERCENT:
        return this.calcPercent(promo, orderSubtotal);

      case PromotionType.FIXED_AMOUNT:
        return this.calcFixed(promo, orderSubtotal);

      case PromotionType.BUY_X_GET_Y:
        return this.calcBuyXGetY(promo, cart);

      case PromotionType.PRODUCT_DISCOUNT:
        return this.calcProductDiscount(promo, cart);

      default:
        throw new BadRequestException('Unknown promotion type');
    }
  }

  private calcPercent(promo: any, subtotal: number): CalculateResult {
    let discount = Math.round((subtotal * promo.value) / 100);
    if (promo.maxDiscount && discount > promo.maxDiscount) {
      discount = promo.maxDiscount;
    }
    return {
      discountAmount: discount,
      description: `ลด ${promo.value}%${promo.maxDiscount ? ` (สูงสุด ฿${promo.maxDiscount})` : ''} = -฿${discount.toLocaleString()}`,
    };
  }

  private calcFixed(promo: any, subtotal: number): CalculateResult {
    const discount = Math.min(promo.value, subtotal);
    return {
      discountAmount: discount,
      description: `ลด ฿${discount.toLocaleString()}`,
    };
  }

  private calcBuyXGetY(promo: any, cart: CartItemForPromo[]): CalculateResult {
    const buyQty = promo.buyQty ?? 2;
    const getQty = promo.getQty ?? 1;

    // กรองเฉพาะสินค้าที่ระบุ (ถ้า productIds ว่าง = ทุกสินค้า)
    const eligible =
      promo.productIds.length > 0
        ? cart.filter((i) => promo.productIds.includes(i.productId))
        : cart;

    // รวมจำนวน
    const totalQty = eligible.reduce((s, i) => s + i.quantity, 0);
    if (totalQty < buyQty + getQty) {
      return { discountAmount: 0, description: `ต้องสั่งอย่างน้อย ${buyQty + getQty} ชิ้น` };
    }

    // ชุดโปรโมชั่นที่ได้รับ
    const sets = Math.floor(totalQty / (buyQty + getQty));
    const freeCount = sets * getQty;

    // ราคาต่ำสุดของสินค้าในตะกร้า × จำนวนฟรี
    const prices = eligible
      .flatMap((i) => Array(i.quantity).fill(i.unitPrice))
      .sort((a, b) => a - b);

    const discount = prices.slice(0, freeCount).reduce((s, p) => s + p, 0);

    return {
      discountAmount: discount,
      description: `ซื้อ ${buyQty} แถม ${getQty} = ลด ฿${discount.toLocaleString()}`,
    };
  }

  private calcProductDiscount(promo: any, cart: CartItemForPromo[]): CalculateResult {
    const eligible =
      promo.productIds.length > 0
        ? cart.filter((i) => promo.productIds.includes(i.productId))
        : cart;

    const eligibleTotal = eligible.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const discount = promo.value >= 1
      ? Math.min(promo.value, eligibleTotal)               // fixed amount
      : Math.round(eligibleTotal * promo.value * 100) / 100; // 0-1 percent

    return {
      discountAmount: discount,
      description: `ส่วนลดสินค้า -฿${discount.toLocaleString()}`,
    };
  }

  // ─── Guard helpers ──────────────────────────────────────────────────────────

  private assertNotExpired(promo: any) {
    const now = new Date();
    if (promo.startDate && promo.startDate > now) {
      throw new BadRequestException('โปรโมชั่นยังไม่เริ่ม');
    }
    if (promo.endDate && promo.endDate < now) {
      throw new BadRequestException('โปรโมชั่นหมดอายุแล้ว');
    }
  }

  private assertUsageLimit(promo: any) {
    if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
      throw new BadRequestException('โปรโมชั่นถูกใช้ครบจำนวนแล้ว');
    }
  }

  /** เพิ่ม usageCount เมื่อออเดอร์สำเร็จ */
  async incrementUsage(promotionId: string) {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: { usageCount: { increment: 1 } },
    });
  }
}
