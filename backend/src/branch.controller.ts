import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { InventoryService } from './inventory.service';
import { PaymentBridgeService } from './payment-bridge.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { CurrentUser } from './auth/current-user.decorator';
import type { JwtPayload } from './auth/jwt-payload';
import {
  UpdatePaymentDeviceDto,
  UpsertPaymentDeviceDto,
} from './dto/payment-bridge.dto';

// Mutating and back-office read routes require ADMIN. Public branch routes are
// sanitized so POS / LIFF can list branches without staff/device details.
const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('ADMIN'));

const ManagerOrAdmin = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('MANAGER', 'ADMIN'),
  );

function assertBranchAccess(user: JwtPayload | null, branchId: string) {
  if (!user) throw new ForbiddenException('Authentication required');
  if (user.role === 'ADMIN') return;
  if (
    (user.role === 'MANAGER' || user.role === 'STAFF') &&
    user.branchId === branchId
  ) {
    return;
  }
  throw new ForbiddenException('You can only access your own branch');
}

@Controller('api/branches')
export class BranchController {
  constructor(
    private readonly branchService: BranchService,
    private readonly inventoryService: InventoryService,
    private readonly paymentBridge: PaymentBridgeService,
  ) {}

  @Get()
  getAll() {
    return this.branchService.getPublicBranches();
  }

  @Get('admin')
  @AdminOnly()
  getAllAdmin() {
    return this.branchService.getAllBranches();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.branchService.getPublicBranchById(id);
  }

  @Get(':id/admin')
  @AdminOnly()
  getOneAdmin(@Param('id') id: string) {
    return this.branchService.getBranchById(id);
  }

  @Post()
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.branchService.createBranch(
      body as unknown as Parameters<typeof this.branchService.createBranch>[0],
    );
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.branchService.updateBranch(
      id,
      body as unknown as Parameters<typeof this.branchService.updateBranch>[1],
    );
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.branchService.deleteBranch(id);
  }

  @Patch(':id/toggle-open')
  @AdminOnly()
  toggleOpen(@Param('id') id: string) {
    return this.branchService.toggleBranchOpen(id);
  }

  // ─── Stats / Dashboard / Orders / Inventory ──────────────────────────────
  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.branchService.getBranchStats(id);
  }

  @Get(':id/dashboard')
  dashboard(@Param('id') id: string) {
    return this.branchService.getBranchDashboard(id);
  }

  @Get(':id/orders')
  orders(@Param('id') id: string) {
    return this.branchService.getBranchOrders(id);
  }

  // ─── Manager-grade endpoints (STAFF of this branch or ADMIN) ─────────────
  @ManagerOrAdmin()
  @Get(':id/manager/dashboard')
  managerDashboard(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    assertBranchAccess(user, id);
    return this.branchService.getManagerDashboard(id);
  }

  @ManagerOrAdmin()
  @Get(':id/manager/history')
  managerHistory(
    @Param('id') id: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('search') search: string | undefined,
    @Query('status') status: string | undefined,
    @Query('platform') platform: string | undefined,
    @Query('page') page: string | undefined,
    @Query('pageSize') pageSize: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    assertBranchAccess(user, id);
    return this.branchService.getManagerHistory(id, {
      from,
      to,
      search,
      status,
      platform,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
  }

  @Get(':id/inventory')
  inventory(@Param('id') id: string) {
    return this.inventoryService.getBranchInventory(id);
  }

  // ─── Branch Menu (per-branch availability) ───────────────────────────────
  // GET is public so POSView can fetch the branch's effective catalog
  // without needing a token. Mutations require MANAGER+ADMIN of this branch.
  @Get(':id/menu')
  branchMenu(@Param('id') id: string) {
    return this.branchService.getBranchMenu(id);
  }

  @ManagerOrAdmin()
  @Patch(':id/menu/:productId/status')
  setBranchProductStatus(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() body: { status: string; reason?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    assertBranchAccess(user, id);
    return this.branchService.setBranchProductStatus(
      id,
      productId,
      body.status,
      user,
      body.reason,
    );
  }

  @ManagerOrAdmin()
  @Delete(':id/menu/:productId/status')
  @HttpCode(200)
  clearBranchProductStatus(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    assertBranchAccess(user, id);
    return this.branchService.clearBranchProductStatus(id, productId);
  }

  // ─── Staff CRUD (Manager of this branch or Admin) ───────────────────────
  @Get(':id/managers')
  @ManagerOrAdmin()
  getManagers(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    assertBranchAccess(user, id);
    return this.branchService.getManagers(id);
  }

  @Post(':id/managers')
  @ManagerOrAdmin()
  addManager(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: JwtPayload,
  ) {
    assertBranchAccess(user, id);
    return this.branchService.addManager(
      id,
      body as unknown as Parameters<typeof this.branchService.addManager>[1],
    );
  }

  @Patch('managers/:managerId')
  @ManagerOrAdmin()
  async updateManager(
    @Param('managerId') managerId: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'ADMIN') {
      const target = await this.branchService.getManagerById(managerId);
      if (!target || target.branchId !== user.branchId) {
        throw new ForbiddenException('Cannot edit staff from another branch');
      }
    }
    return this.branchService.updateManager(
      managerId,
      body as unknown as Parameters<typeof this.branchService.updateManager>[1],
    );
  }

  @Delete('managers/:managerId')
  @ManagerOrAdmin()
  @HttpCode(200)
  async removeManager(
    @Param('managerId') managerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'ADMIN') {
      const target = await this.branchService.getManagerById(managerId);
      if (!target || target.branchId !== user.branchId) {
        throw new ForbiddenException('Cannot delete staff from another branch');
      }
    }
    return this.branchService.deleteManager(managerId);
  }

  // ─── Branch payment forwarder devices ────────────────────────────────────
  @Get(':id/payment-devices')
  @ManagerOrAdmin()
  listPaymentDevices(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    assertBranchAccess(user, id);
    return this.paymentBridge.listDevices(id);
  }

  @Post(':id/payment-devices')
  @ManagerOrAdmin()
  createPaymentDevice(
    @Param('id') id: string,
    @Body() body: UpsertPaymentDeviceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    assertBranchAccess(user, id);
    return this.paymentBridge.createDevice(id, body);
  }

  @Patch('payment-devices/:deviceId')
  @ManagerOrAdmin()
  async updatePaymentDevice(
    @Param('deviceId') deviceId: string,
    @Body() body: UpdatePaymentDeviceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'ADMIN') {
      const target = await this.paymentBridge.getDeviceById(deviceId);
      if (!target || target.branchId !== user.branchId) {
        throw new ForbiddenException('Cannot edit payment device from another branch');
      }
    }
    return this.paymentBridge.updateDevice(deviceId, body);
  }

  @Delete('payment-devices/:deviceId')
  @ManagerOrAdmin()
  @HttpCode(200)
  async removePaymentDevice(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'ADMIN') {
      const target = await this.paymentBridge.getDeviceById(deviceId);
      if (!target || target.branchId !== user.branchId) {
        throw new ForbiddenException('Cannot delete payment device from another branch');
      }
    }
    return this.paymentBridge.deleteDevice(deviceId);
  }
}
