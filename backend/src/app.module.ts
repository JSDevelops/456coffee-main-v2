import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { BranchController } from './branch.controller';
import { OrderController } from './order.controller';
import { MenuController } from './menu.controller';
import { InventoryController } from './inventory.controller';
import { AiController } from './ai.controller';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { AddressController } from './address.controller';
import { FinanceController } from './finance.controller';
import { SettingController } from './setting.controller';
import { UploadController } from './upload.controller';
import { PaymentBridgeController } from './payment-bridge.controller';
import { PromotionController } from './promotion.controller';
import { HrController } from './hr.controller';
import { AnnouncementController } from './announcement.controller';
import { EcosystemController } from './ecosystem.controller';

import { PrismaService } from './prisma.service';
import { OrderService } from './order.service';
import { OrderGateway } from './order.gateway';
import { AiService } from './ai.service';
import { InventoryService } from './inventory.service';
import { BranchService } from './branch.service';
import { MenuService } from './menu.service';
import { InventoryTransactionService } from './inventory-transaction.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { AddressService } from './address.service';
import { FinanceService } from './finance.service';
import { SettingService } from './setting.service';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';
import { PaymentService } from './payment.service';
import { PaymentBridgeService } from './payment-bridge.service';
import { PromotionService } from './promotion.service';
import { HrService } from './hr.service';
import { AnnouncementService } from './announcement.service';
import { EcosystemService } from './ecosystem.service';

import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { OtpStore, InMemoryOtpStore } from './auth/otp-store';

// Re-export guards so consumers can `@UseGuards(JwtAuthGuard, RolesGuard)`
// on individual controllers/routes that need protection.
export { JwtAuthGuard, RolesGuard };

@Module({
  imports: [
    JwtModule.register({
      global: true,
      // In production set JWT_SECRET via env. Dev fallback exists for ergonomics.
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      // `as any` because @nestjs/jwt typings narrow expiresIn to a literal-union;
      // accepting an env-provided string keeps configuration flexible.
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any },
    }),
    // Default cap: 100 requests / minute / IP. Auth endpoints override this
    // tighter via @Throttle() to slow brute-force attempts. NOTE: storage is
    // in-memory — for multi-instance deploys swap to a Redis/cluster storage.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
  ],
  controllers: [
    AppController,
    BranchController,
    OrderController,
    MenuController,
    InventoryController,
    AiController,
    AuthController,
    UserController,
    AddressController,
    FinanceController,
    SettingController,
    UploadController,
    ShiftController,
    PaymentBridgeController,
    PromotionController,
    HrController,
    AnnouncementController,
    EcosystemController,
  ],
  providers: [
    PrismaService,
    OrderService,
    OrderGateway,
    AiService,
    InventoryService,
    BranchService,
    MenuService,
    AuthService,
    UserService,
    AddressService,
    InventoryTransactionService,
    FinanceService,
    SettingService,
    ShiftService,
    PaymentService,
    PaymentBridgeService,
    PromotionService,
    HrService,
    AnnouncementService,
    EcosystemService,
    // JWT/role guards are NOT applied globally — opt-in per controller while
    // frontends migrate to sending Bearer tokens.
    JwtAuthGuard,
    RolesGuard,
    // OTP storage. Swap InMemoryOtpStore for a Redis-backed impl when scaling
    // beyond a single instance — see auth/otp-store.ts.
    { provide: OtpStore, useClass: InMemoryOtpStore },
    // Rate limiting IS applied globally — protects every endpoint with the
    // default bucket. Auth endpoints tighten further via @Throttle().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
