import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { FinanceService, CreateCashflowDto } from './finance.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

// All financial endpoints require ADMIN — sensitive data, no public consumers.
@Controller('api/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('cashflow')
  async createTransaction(@Body() data: CreateCashflowDto) {
    return this.financeService.createTransaction(data);
  }

  @Get('cashflow')
  async getTransactions(
    @Query('branchId') branchId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getTransactions({ branchId, type, startDate, endDate });
  }

  @Get('summary')
  async getSummary(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getSummary({ branchId, startDate, endDate });
  }
}
