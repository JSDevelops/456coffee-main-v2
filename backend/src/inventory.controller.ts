import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { InventoryTransactionService } from './inventory-transaction.service';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { PrismaService } from './prisma.service';

const StaffOrAdmin = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('STAFF', 'ADMIN'));

const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('ADMIN'));

@Controller('api/inventory')
export class InventoryController {
  constructor(
    private readonly txService: InventoryTransactionService,
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Transactions ─────────────────────────────────────────────────────────
  @Get('transactions')
  @StaffOrAdmin()
  getTransactions(
    @Query('branchId') branchId?: string,
    @Query('ingredientId') ingredientId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.txService.getTransactions({ branchId, ingredientId, type, startDate, endDate });
  }

  @Post('transactions')
  @StaffOrAdmin()
  createTransaction(@Body() body: Record<string, unknown>) {
    return this.txService.createTransaction(
      body as unknown as Parameters<typeof this.txService.createTransaction>[0],
    );
  }

  // ─── Low Stock Alert ──────────────────────────────────────────────────────
  @Get('low-stock')
  @StaffOrAdmin()
  async getLowStock(@Query('branchId') branchId?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const items = await this.prisma.inventory.findMany({
      where,
      include: { ingredient: true, branch: { select: { id: true, name: true } } },
      orderBy: { quantity: 'asc' },
    });

    return items.filter((i) => i.quantity <= i.lowStockThreshold);
  }

  // ─── Stock Summary (valuation) ────────────────────────────────────────────
  @Get('summary')
  @StaffOrAdmin()
  async getSummary(@Query('branchId') branchId?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const items = await this.prisma.inventory.findMany({
      where,
      include: { ingredient: true },
    });

    const totalValue = items.reduce(
      (s, i) => s + i.quantity * (i.ingredient.costPerUnit || 0),
      0,
    );
    const lowStockCount = items.filter((i) => i.quantity <= i.lowStockThreshold).length;
    const outOfStockCount = items.filter((i) => i.quantity <= 0).length;

    return {
      totalValue,
      itemCount: items.length,
      lowStockCount,
      outOfStockCount,
      items: items.map((i) => ({
        id: i.id,
        ingredientId: i.ingredientId,
        name: i.ingredient.name,
        unit: i.ingredient.unit,
        sku: i.ingredient.sku,
        costPerUnit: i.ingredient.costPerUnit,
        quantity: i.quantity,
        lowStockThreshold: i.lowStockThreshold,
        totalValue: i.quantity * (i.ingredient.costPerUnit || 0),
        status:
          i.quantity <= 0
            ? 'OUT_OF_STOCK'
            : i.quantity <= i.lowStockThreshold
            ? 'LOW'
            : 'OK',
      })),
    };
  }

  // ─── Update Threshold ─────────────────────────────────────────────────────
  @Patch('threshold/:branchId/:ingredientId')
  @StaffOrAdmin()
  async updateThreshold(
    @Param('branchId') branchId: string,
    @Param('ingredientId') ingredientId: string,
    @Body('threshold') threshold: number,
  ) {
    return this.prisma.inventory.upsert({
      where: { branchId_ingredientId: { branchId, ingredientId } },
      update: { lowStockThreshold: threshold },
      create: { branchId, ingredientId, quantity: 0, lowStockThreshold: threshold },
    });
  }
}
