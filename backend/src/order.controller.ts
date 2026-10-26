import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  ForbiddenException,
  Param,
  Query,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentDto,
} from './dto/create-order.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { CurrentUser } from './auth/current-user.decorator';
import type { JwtPayload } from './auth/jwt-payload';

const Authenticated = () => UseGuards(JwtAuthGuard);
const StaffOrAdmin = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('STAFF', 'MANAGER', 'ADMIN'),
  );
const ManagerOrAdmin = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('MANAGER', 'ADMIN'),
  );
const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('ADMIN'));

@Controller('api')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Listing endpoints expose revenue/customer/order data, so keep them admin-only.
  @Get('orders')
  @AdminOnly()
  getAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('fulfillmentType') fulfillmentType?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orderService.getAllOrders({
      branchId,
      status,
      date,
      dateFrom,
      dateTo,
      search,
      paymentMethod,
      fulfillmentType,
      sort,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('orders/recent')
  @AdminOnly()
  recent(@Query('limit') limit?: string) {
    return this.orderService.getRecentOrders(limit ? parseInt(limit) : 10);
  }

  @Get('orders/stats')
  @AdminOnly()
  stats(@Query('branchId') branchId?: string) {
    return this.orderService.getOrderStats(branchId);
  }

  @Get('orders/customer/:uid')
  @Authenticated()
  customerOrders(@Param('uid') uid: string, @CurrentUser() me: JwtPayload) {
    return this.orderService.getCustomerOrdersFor(uid, me);
  }

  @Get('orders/:id')
  @Authenticated()
  async one(@Param('id') id: string, @CurrentUser() me: JwtPayload) {
    const order = await this.orderService.getOrderById(id);
    if (me.role === 'ADMIN') return order;
    if ((me.role === 'STAFF' || me.role === 'MANAGER') && me.branchId === order.branchId) {
      return order;
    }
    if (me.role === 'CUSTOMER' && order.userId === me.sub) return order;
    throw new ForbiddenException('Cannot access this order');
  }

  @Get('orders/:id/payment/qr')
  @Authenticated()
  paymentQr(@Param('id') id: string) {
    return this.orderService.getPaymentQr(id);
  }

  // Mutating endpoints — require auth.
  @Post('orders')
  @Authenticated()
  create(@Body() data: CreateOrderDto, @CurrentUser() me: JwtPayload) {
    return this.orderService.createOrder(data, me);
  }

  @Patch('orders/:id/status')
  @StaffOrAdmin()
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
    @CurrentUser() me: JwtPayload,
  ) {
    return this.orderService.updateOrderStatus(id, body.status, body.metadata, me);
  }

  @Patch('orders/:id/payment')
  @StaffOrAdmin()
  payment(@Param('id') id: string, @Body() body: UpdatePaymentDto) {
    return this.orderService.updatePaymentStatus(id, body);
  }

  @Patch('orders/:id/cancel')
  @Authenticated()
  cancel(
    @Param('id') id: string,
    @CurrentUser() me: JwtPayload,
    @Body('reason') reason?: string,
  ) {
    return this.orderService.cancelOrder(id, reason, me);
  }

  @Post('orders/:id/refund')
  @ManagerOrAdmin()
  refund(
    @Param('id') id: string,
    @Body() body: { reason: string; amount?: number },
    @CurrentUser() me: JwtPayload,
  ) {
    return this.orderService.refundOrder(id, body, me);
  }

  @Get('stats/global')
  @AdminOnly()
  globalStats() {
    return this.orderService.getGlobalStats();
  }

  @Get('stats/top-products')
  @AdminOnly()
  topProducts(
    @Query('branchId') branchId?: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'quantity' | 'revenue',
  ) {
    return this.orderService.getTopProducts({
      branchId,
      days: days ? parseInt(days) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sortBy: sortBy === 'revenue' ? 'revenue' : 'quantity',
    });
  }

  @Get('stats/revenue-trend')
  @AdminOnly()
  revenueTrend(
    @Query('days') days?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.orderService.getRevenueTrend(
      days ? parseInt(days) : 7,
      branchId,
    );
  }
}
