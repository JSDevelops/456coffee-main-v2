import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { CurrentUser } from './auth/current-user.decorator';
import type { JwtPayload } from './auth/jwt-payload';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

class OpenShiftDto {
  @IsNumber()
  @Min(0)
  openingCash!: number;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  openedBy?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;

  @IsOptional()
  @IsArray()
  openingStock?: { ingredientId: string; actualQty: number }[];
}

class CloseShiftDto {
  @IsNumber()
  @Min(0)
  closingCash!: number;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  closedBy?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;

  @IsOptional()
  @IsArray()
  closingStock?: { ingredientId: string; actualQty: number; wasteQty: number; wasteReason: string }[];
}

const ManagerOrAdmin = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('MANAGER', 'ADMIN'),
  );

@Controller('api')
export class ShiftController {
  constructor(private readonly shifts: ShiftService) {}

  @ManagerOrAdmin()
  @Get('branches/:branchId/shift/current')
  current(
    @Param('branchId') branchId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.shifts.getCurrent(branchId, user);
  }

  @ManagerOrAdmin()
  @Get('branches/:branchId/shift/history')
  history(
    @Param('branchId') branchId: string,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.shifts.getHistory(branchId, user, limit ? parseInt(limit) : 30);
  }

  @ManagerOrAdmin()
  @Post('branches/:branchId/shift/open')
  open(
    @Param('branchId') branchId: string,
    @Body() body: OpenShiftDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.shifts.open(branchId, body, user);
  }

  @ManagerOrAdmin()
  @Post('shift/:id/close')
  close(
    @Param('id') id: string,
    @Body() body: CloseShiftDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.shifts.close(id, body, user);
  }
}
