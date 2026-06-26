import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import type { CreatePromotionDto, CartItemForPromo } from './promotion.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('api/promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  // ─── Public / Branch endpoints ─────────────────────────────────────────────

  /** GET /promotions?branchId=xxx — รายการโปรโมชั่นที่ active */
  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.promotionService.findAll(branchId);
  }

  /** GET /promotions/all?branchId=xxx — รายการทั้งหมด (Admin) */
  @UseGuards(JwtAuthGuard)
  @Get('all')
  findAllAdmin(@Query('branchId') branchId?: string) {
    return this.promotionService.findAllAdmin(branchId);
  }

  /** GET /promotions/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionService.findOne(id);
  }

  /** POST /promotions/by-code — ค้นหาโปรโมชั่นจาก coupon code */
  @Post('by-code')
  findByCode(@Body('code') code: string) {
    return this.promotionService.findByCode(code);
  }

  /** POST /promotions/calculate — คำนวณส่วนลด */
  @Post('calculate')
  calculate(
    @Body()
    body: {
      promotionId: string;
      cart: CartItemForPromo[];
      orderSubtotal: number;
    },
  ) {
    return this.promotionService.calculate(
      body.promotionId,
      body.cart,
      body.orderSubtotal,
    );
  }

  /** POST /promotions/calculate-code — คำนวณจาก coupon code */
  @Post('calculate-code')
  calculateByCode(
    @Body()
    body: {
      code: string;
      cart: CartItemForPromo[];
      orderSubtotal: number;
    },
  ) {
    return this.promotionService.calculateByCode(
      body.code,
      body.cart,
      body.orderSubtotal,
    );
  }

  // ─── Manager / Admin endpoints ────────────────────────────────────────────

  /** POST /promotions — สร้างโปรโมชั่นใหม่ */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePromotionDto, @Request() req: any) {
    return this.promotionService.create(dto, req.user?.sub);
  }

  /** PATCH /promotions/:id — แก้ไขโปรโมชั่น */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePromotionDto>) {
    return this.promotionService.update(id, dto);
  }

  /** DELETE /promotions/:id — ปิดการใช้งานโปรโมชั่น */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionService.remove(id);
  }
}
