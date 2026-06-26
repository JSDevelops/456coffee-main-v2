import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { CurrentUser } from './auth/current-user.decorator';
import type { JwtPayload } from './auth/jwt-payload';
import { PaymentBridgeService } from './payment-bridge.service';
import {
  IncomingPaymentDto,
  PaymentDeviceLoginDto,
} from './dto/payment-bridge.dto';

const AppOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('APP'));

@Controller('api')
export class PaymentBridgeController {
  constructor(private readonly paymentBridge: PaymentBridgeService) {}

  @Public()
  @Post('app/login')
  login(@Body() body: PaymentDeviceLoginDto) {
    return this.paymentBridge.login(body.username, body.password);
  }

  @AppOnly()
  @Get('app/verify')
  verify(@CurrentUser() user: JwtPayload | null) {
    return this.paymentBridge.verify(user);
  }

  @AppOnly()
  @Post('app/logout')
  logout() {
    return { success: true };
  }

  @AppOnly()
  @Get('sms/test')
  test(@CurrentUser() user: JwtPayload | null) {
    return this.paymentBridge.test(user);
  }

  @AppOnly()
  @Post('sms/incoming')
  incoming(
    @CurrentUser() user: JwtPayload | null,
    @Body() body: IncomingPaymentDto,
  ) {
    return this.paymentBridge.handleIncoming(user, body);
  }
}
