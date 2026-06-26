import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementService, CreateAnnouncementDto, UpdateAnnouncementDto } from './announcement.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Public } from './auth/public.decorator';

@Controller('api/announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get('customer')
  @Public()
  async getCustomerAnnouncements() {
    return this.announcementService.getCustomerAnnouncements();
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() body: CreateAnnouncementDto) {
    return this.announcementService.create(body);
  }

  @Get()
  @Roles('ADMIN')
  async getAll() {
    return this.announcementService.getAll();
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAnnouncementDto,
  ) {
    return this.announcementService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.announcementService.delete(id);
  }

  @Get('branch/:branchId')
  @Roles('MANAGER', 'ADMIN')
  async getForBranch(@Param('branchId') branchId: string) {
    return this.announcementService.getForBranch(branchId);
  }
}
