import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Public } from './auth/public.decorator';
import { HrService } from './hr.service';

@Controller('api/hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HrController {
  constructor(private hr: HrService) {}

  // ─── Attendance ──────────────────────────────────────────────────────────────

  @Get('attendance')
  @Roles('MANAGER', 'ADMIN')
  getAttendance(
    @Query('branchId') branchId: string,
    @Query('date') date?: string,
  ) {
    return this.hr.getAttendance(branchId, date);
  }

  @Get('attendance/range')
  @Roles('MANAGER', 'ADMIN')
  getAttendanceRange(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.hr.getAttendanceRange(branchId, from, to);
  }

  @Post('attendance/clock-in')
  @Roles('MANAGER', 'ADMIN')
  clockIn(@Body() body: { branchId: string; pin: string }) {
    return this.hr.clockIn(body.branchId, body.pin);
  }

  @Post('attendance/clock-out')
  @Roles('MANAGER', 'ADMIN')
  clockOut(@Body() body: { branchId: string; pin: string }) {
    return this.hr.clockOutByPin(body.branchId, body.pin);
  }

  @Delete('attendance/:id')
  @Roles('MANAGER', 'ADMIN')
  deleteAttendance(@Param('id') id: string) {
    return this.hr.deleteAttendance(id);
  }

  // ─── Leave ───────────────────────────────────────────────────────────────────

  @Get('leave')
  @Roles('MANAGER', 'ADMIN')
  getLeaves(@Query('branchId') branchId: string, @Query('status') status?: string) {
    return this.hr.getLeaves(branchId, status);
  }

  @Post('leave')
  @Roles('MANAGER', 'ADMIN')
  createLeave(@Body() body: {
    branchId: string;
    staffId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    return this.hr.createLeave(body);
  }

  @Patch('leave/:id/status')
  @Roles('MANAGER', 'ADMIN')
  updateLeaveStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; managerNote?: string },
  ) {
    return this.hr.updateLeaveStatus(id, body.status, body.managerNote);
  }

  @Delete('leave/:id')
  @Roles('MANAGER', 'ADMIN')
  deleteLeave(@Param('id') id: string) {
    return this.hr.deleteLeave(id);
  }

  // ─── Salary ──────────────────────────────────────────────────────────────────

  @Get('salary')
  @Roles('MANAGER', 'ADMIN')
  getSalaries(@Query('branchId') branchId: string) {
    return this.hr.getSalaries(branchId);
  }

  @Post('salary')
  @Roles('MANAGER', 'ADMIN')
  upsertSalary(@Body() dto: {
    staffId: string;
    branchId: string;
    payType: string;
    baseSalary: number;
    hourlyRate: number;
    socialSec: number;
    tax: number;
  }) {
    return this.hr.upsertSalary(dto);
  }

  // ─── Payslip ─────────────────────────────────────────────────────────────────

  @Get('payslip')
  @Roles('MANAGER', 'ADMIN')
  getPayslips(
    @Query('branchId') branchId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.hr.getPayslips(branchId, year ? +year : undefined, month ? +month : undefined);
  }

  @Post('payslip/generate')
  @Roles('MANAGER', 'ADMIN')
  generatePayslips(@Body() body: { branchId: string; year: number; month: number }) {
    return this.hr.generatePayslips(body.branchId, body.year, body.month);
  }

  @Patch('payslip/:id/paid')
  @Roles('MANAGER', 'ADMIN')
  markPaid(@Param('id') id: string) {
    return this.hr.markPayslipPaid(id);
  }

  // ─── Staff Schedule ────────────────────────────────────────────────────────
  @Get('schedule')
  @Roles('MANAGER', 'ADMIN')
  getSchedules(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.hr.getSchedules(branchId, startDate, endDate);
  }

  @Post('schedule')
  @Roles('MANAGER', 'ADMIN')
  createSchedule(@Body() dto: {
    id?: string;
    branchId: string;
    staffId: string;
    date: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    note?: string;
  }) {
    return this.hr.createSchedule(dto);
  }

  @Post('schedule/bulk')
  @Roles('MANAGER', 'ADMIN')
  createBulkSchedule(@Body() dto: {
    branchId: string;
    staffId: string;
    startDate: string;
    endDate: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    note?: string;
    workDays: number[];
    offDays: number[];
  }) {
    return this.hr.createBulkSchedule(dto);
  }

  @Delete('schedule/:id')
  @Roles('MANAGER', 'ADMIN')
  deleteSchedule(@Param('id') id: string) {
    return this.hr.deleteSchedule(id);
  }

  // ─── Monthly Plan / Events ──────────────────────────────────────────────────
  @Get('monthly-plan')
  @Roles('MANAGER', 'ADMIN')
  getMonthlyPlans(
    @Query('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.hr.getMonthlyPlans(branchId, startDate, endDate);
  }

  @Post('monthly-plan')
  @Roles('MANAGER', 'ADMIN')
  createMonthlyPlan(@Body() dto: {
    id?: string;
    branchId: string;
    title: string;
    date: string;
    note?: string;
  }) {
    return this.hr.createMonthlyPlan(dto);
  }

  @Delete('monthly-plan/:id')
  @Roles('MANAGER', 'ADMIN')
  deleteMonthlyPlan(@Param('id') id: string) {
    return this.hr.deleteMonthlyPlan(id);
  }

  // ─── Mobile Public Attendance ──────────────────────────────────────────────
  @Public()
  @Get('public/branch/:branchId/staff')
  getPublicBranchStaff(@Param('branchId') branchId: string) {
    return this.hr.getPublicBranchStaff(branchId);
  }

  @Public()
  @Post('public/clock')
  publicClock(@Body() body: { branchId: string; pin: string }) {
    return this.hr.mobileClock(body.branchId, body.pin);
  }
}
