import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  ForbiddenException,
  applyDecorators,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { Public } from './auth/public.decorator';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { CurrentUser } from './auth/current-user.decorator';
import type { JwtPayload } from './auth/jwt-payload';
import {
  SendOtpDto,
  VerifyOtpDto,
  LineLoginDto,
  GoogleLoginDto,
  AdminLoginDto,
  StaffLoginDto,
  UpdateAdminProfileDto,
  ChangeAdminPasswordDto,
} from './dto/auth.dto';

const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('ADMIN'));

// 5 attempts per minute / IP — slows brute-force on credential endpoints.
const LOGIN_THROTTLE = { default: { ttl: 60_000, limit: 5 } };

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('otp/send')
  sendOtp(@Body() body: SendOtpDto) {
    return this.authService.sendOtp(body.phone);
  }

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('otp/verify')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const { user, token } = await this.authService.verifyOtp(
      body.phone,
      body.code,
      { name: body.name },
    );
    return { ...user, token };
  }

  @Public()
  @Post('line')
  async loginWithLine(@Body() body: LineLoginDto) {
    const { user, token } = await this.authService.loginWithLine({
      lineUid: body.lineUid,
      accessToken: body.accessToken,
      displayName: body.displayName,
      pictureUrl: body.pictureUrl,
      email: body.email,
    });
    return { ...user, token };
  }

  @Public()
  @Post('google')
  async loginWithGoogle(@Body() body: GoogleLoginDto) {
    const { user, token } = await this.authService.loginWithGoogle({
      idToken: body.idToken,
      accessToken: body.accessToken,
      googleId: body.googleId,
      displayName: body.displayName,
      pictureUrl: body.pictureUrl,
      email: body.email,
    });
    return { ...user, token };
  }

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('admin-login')
  adminLogin(@Body() body: AdminLoginDto) {
    return this.authService.adminLogin(body.username, body.password);
  }

  @AdminOnly()
  @Get('admin-profile')
  async getAdminProfile(@CurrentUser() user: JwtPayload | null) {
    if (user?.sub !== 'system-admin') {
      throw new ForbiddenException('Only the system admin can view this profile');
    }
    return this.authService.getAdminProfile();
  }

  @AdminOnly()
  @Patch('admin-profile')
  async updateAdminProfile(
    @CurrentUser() user: JwtPayload | null,
    @Body() body: UpdateAdminProfileDto,
  ) {
    if (user?.sub !== 'system-admin') {
      throw new ForbiddenException('Only the system admin can edit this profile');
    }
    return this.authService.updateAdminProfile(body);
  }

  @AdminOnly()
  @Throttle(LOGIN_THROTTLE)
  @Post('admin-change-password')
  async changeAdminPassword(
    @CurrentUser() user: JwtPayload | null,
    @Body() body: ChangeAdminPasswordDto,
  ) {
    if (user?.sub !== 'system-admin') {
      throw new ForbiddenException('Only the system admin can change this password');
    }
    return this.authService.changeAdminPassword(
      body.currentPassword,
      body.newPassword,
    );
  }

  @Public()
  @Throttle(LOGIN_THROTTLE)
  @Post('staff-login')
  staffLogin(@Body() body: StaffLoginDto) {
    return this.authService.staffLogin(body.branchId, body.pin);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtPayload | null) {
    if (!user?.sub || user.sub.startsWith('system-') || user.sub.startsWith('branch-')) {
      // System/staff tokens are not real Users — nothing to fetch.
      return user
        ? { id: user.sub, role: user.role, branchId: user.branchId }
        : null;
    }
    return this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        authProviders: true,
        addresses: true,
        pointHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  @Post('link')
  @UseGuards(JwtAuthGuard)
  async linkAccount(
    @CurrentUser() user: JwtPayload,
    @Body() body: { provider: string; providerId: string },
  ) {
    return this.authService.linkProvider(
      user.sub,
      body.provider,
      body.providerId,
    );
  }
}
