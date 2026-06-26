import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { SettingService } from './setting.service';
import { UpdateSettingsDto } from './dto/setting.dto';
import { Public } from './auth/public.decorator';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { OrderGateway } from './order.gateway';

const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('ADMIN'));

@Controller('api/settings')
export class SettingController {
  constructor(
    private readonly settings: SettingService,
    private readonly gateway: OrderGateway,
  ) {}

  /**
   * Public — every frontend hits this on startup to hydrate the UI
   * (font, theme, etc.). No secrets should live in here.
   */
  @Public()
  @Get()
  async get() {
    return this.settings.getPublic();
  }

  @AdminOnly()
  @Get('admin')
  async getAdmin() {
    return this.settings.getAll();
  }

  @AdminOnly()
  @Patch('admin')
  async updateAdmin(@Body() body: UpdateSettingsDto) {
    const merged = await this.settings.setManyAdmin(body.settings);
    // Push to every connected client so they re-apply without a refresh.
    this.gateway.broadcastSettings(await this.settings.getPublic());
    return merged;
  }
}
