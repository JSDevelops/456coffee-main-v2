import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CurrentUser } from './auth/current-user.decorator';
import type { JwtPayload } from './auth/jwt-payload';

@Controller('api/addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private addressService: AddressService) {}

  /**
   * Customer reads their own addresses. We honour ?userId= for backward
   * compat with existing clients but the userId MUST match the JWT subject —
   * otherwise it's a forbidden cross-customer read.
   */
  @Get()
  async getByUser(
    @CurrentUser() me: JwtPayload,
    @Query('userId') userId?: string,
  ) {
    const targetId = userId || me.sub;
    if (targetId !== me.sub && me.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot read another user’s addresses');
    }
    if (!targetId) throw new BadRequestException('User ID is required');
    return this.addressService.getByUser(targetId);
  }

  @Post()
  async create(
    @CurrentUser() me: JwtPayload,
    @Body()
    body: {
      userId?: string;
      label: string;
      address: string;
      latitude?: number;
      longitude?: number;
      isDefault?: boolean;
    },
  ) {
    const ownerId = body.userId || me.sub;
    if (ownerId !== me.sub && me.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot create addresses for another user');
    }
    return this.addressService.create(ownerId, body);
  }

  @Patch(':id')
  async update(
    @CurrentUser() me: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: {
      userId?: string;
      label?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      isDefault?: boolean;
    },
  ) {
    const ownerId = body.userId || me.sub;
    if (ownerId !== me.sub && me.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot update another user’s address');
    }
    return this.addressService.update(id, ownerId, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() me: JwtPayload, @Param('id') id: string) {
    const addr = await this.addressService.getById(id);
    if (!addr) throw new NotFoundException(`Address ${id} not found`);
    if (addr.userId !== me.sub && me.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot delete another user’s address');
    }
    return this.addressService.delete(id);
  }
}
