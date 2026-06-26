import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { CurrentUser } from './auth/current-user.decorator';
import type { JwtPayload } from './auth/jwt-payload';

const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('ADMIN'));
const StaffOrAdmin = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('STAFF', 'MANAGER', 'ADMIN'),
  );

@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

  // Customer data is searchable from POS/admin only.
  @Get()
  @StaffOrAdmin()
  async getAllUsers(@Query('search') search?: string) {
    return this.userService.getAllUsers(search);
  }

  @Get(':id')
  @StaffOrAdmin()
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Post()
  @StaffOrAdmin()
  async createUser(@Body() body: { name?: string; phone?: string; email?: string }) {
    return this.userService.createUser(body);
  }

  // Mutating customer state — admin only.
  @Patch(':id/points')
  @AdminOnly()
  async updatePoints(
    @Param('id') id: string,
    @Body() body: { delta: number; reason?: string },
    @CurrentUser() me: JwtPayload,
  ) {
    return this.userService.updatePoints(id, body.delta, body.reason, undefined, me);
  }

  @Patch(':id/role')
  @AdminOnly()
  async setRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.userService.setRole(id, body.role);
  }
}
