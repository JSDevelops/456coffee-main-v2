import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  EcosystemService,
  CreateAcademyEnrollmentDto,
  CreatePlantationBookingDto,
  UpsertLocationDto,
} from './ecosystem.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

@Controller('api/ecosystem')
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}

  // ════════════════════════════════════════════════════════════════════════
  // Public Endpoints (Accessible from Landing Page / Web)
  // ════════════════════════════════════════════════════════════════════════

  @Post('academy/enroll')
  @HttpCode(HttpStatus.CREATED)
  async enrollAcademy(@Body() dto: CreateAcademyEnrollmentDto) {
    const result = await this.ecosystemService.createAcademyEnrollment(dto);
    return {
      success: true,
      message: 'ลงทะเบียนสมัครเรียนเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด',
      data: result,
    };
  }

  @Post('plantations/book')
  @HttpCode(HttpStatus.CREATED)
  async bookPlantation(@Body() dto: CreatePlantationBookingDto) {
    const result = await this.ecosystemService.createPlantationBooking(dto);
    return {
      success: true,
      message: 'บันทึกการจองต้นกล้าพันธุ์และพิกัดแปลงปลูกเรียบร้อยแล้ว',
      data: result,
    };
  }

  @Get('locations')
  async getPublicLocations() {
    const locations = await this.ecosystemService.getPublicLocations();
    return {
      success: true,
      data: locations,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // Super Admin Endpoints
  // ════════════════════════════════════════════════════════════════════════

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminStats() {
    const stats = await this.ecosystemService.getEcosystemStats();
    return {
      success: true,
      data: stats,
    };
  }

  // Academy Admin
  @Get('admin/academy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminAcademyEnrollments(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('courseTrack') courseTrack?: string,
  ) {
    const list = await this.ecosystemService.getAcademyEnrollments({ search, status, courseTrack });
    return {
      success: true,
      data: list,
    };
  }

  @Patch('admin/academy/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateAcademyEnrollment(
    @Param('id') id: string,
    @Body() body: { status?: string; batchNo?: number; adminNotes?: string },
  ) {
    const updated = await this.ecosystemService.updateAcademyEnrollment(id, body);
    return {
      success: true,
      data: updated,
    };
  }

  @Delete('admin/academy/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteAcademyEnrollment(@Param('id') id: string) {
    await this.ecosystemService.deleteAcademyEnrollment(id);
    return {
      success: true,
      message: 'ลบรายการผู้สมัครเรียบร้อยแล้ว',
    };
  }

  // Plantation Admin
  @Get('admin/plantations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminPlantations(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('province') province?: string,
  ) {
    const list = await this.ecosystemService.getPlantationBookings({ search, status, province });
    return {
      success: true,
      data: list,
    };
  }

  @Patch('admin/plantations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updatePlantationBooking(
    @Param('id') id: string,
    @Body()
    body: {
      status?: string;
      saplingCount?: number;
      isPublicOnMap?: boolean;
      adminNotes?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const updated = await this.ecosystemService.updatePlantationBooking(id, body);
    return {
      success: true,
      data: updated,
    };
  }

  @Delete('admin/plantations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deletePlantationBooking(@Param('id') id: string) {
    await this.ecosystemService.deletePlantationBooking(id);
    return {
      success: true,
      message: 'ลบรายการแปลงปลูกเรียบร้อยแล้ว',
    };
  }

  // Locations Manager Admin
  @Get('admin/locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminLocations() {
    const list = await this.ecosystemService.getAllLocations();
    return {
      success: true,
      data: list,
    };
  }

  @Post('admin/locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createLocation(@Body() dto: UpsertLocationDto) {
    const created = await this.ecosystemService.createLocation(dto);
    return {
      success: true,
      data: created,
    };
  }

  @Patch('admin/locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateLocation(@Param('id') id: string, @Body() dto: Partial<UpsertLocationDto>) {
    const updated = await this.ecosystemService.updateLocation(id, dto);
    return {
      success: true,
      data: updated,
    };
  }

  @Delete('admin/locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteLocation(@Param('id') id: string) {
    await this.ecosystemService.deleteLocation(id);
    return {
      success: true,
      message: 'ลบจุดปักหมุดเรียบร้อยแล้ว',
    };
  }
}
