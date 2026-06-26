import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private dateDiff(start: string, end: string): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  }

  // ─── Attendance ──────────────────────────────────────────────────────────────

  async getAttendance(branchId: string, date?: string) {
    const d = date || this.today();
    return this.prisma.attendanceRecord.findMany({
      where: { branchId, date: d },
      orderBy: { clockIn: 'asc' },
    });
  }

  async getAttendanceRange(branchId: string, from: string, to: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { branchId, date: { gte: from, lte: to } },
      orderBy: [{ date: 'desc' }, { clockIn: 'asc' }],
    });
  }

  async clockIn(branchId: string, pin: string) {
    const staff = await this.prisma.branchManager.findFirst({
      where: { branchId, pin, isActive: true },
    });
    if (!staff) throw new BadRequestException('PIN ไม่ถูกต้องหรือพนักงานไม่ได้เปิดใช้งาน');

    const today = this.today();
    const existing = await this.prisma.attendanceRecord.findFirst({
      where: { staffId: staff.id, date: today, clockOut: null },
    });
    if (existing) throw new BadRequestException('บันทึกเวลาเข้างานแล้วในวันนี้ กรุณาบันทึกเวลาออกก่อน');

    return this.prisma.attendanceRecord.create({
      data: {
        staffId: staff.id,
        staffName: staff.name,
        branchId,
        date: today,
        clockIn: new Date(),
      },
    });
  }

  async clockOutByPin(branchId: string, pin: string) {
    const staff = await this.prisma.branchManager.findFirst({
      where: { branchId, pin, isActive: true },
    });
    if (!staff) throw new BadRequestException('PIN ไม่ถูกต้อง');

    const today = this.today();
    const record = await this.prisma.attendanceRecord.findFirst({
      where: { staffId: staff.id, date: today, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });
    if (!record) throw new BadRequestException('ยังไม่ได้บันทึกเวลาเข้างาน');

    const now = new Date();
    const hours = (now.getTime() - record.clockIn.getTime()) / 3_600_000;
    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { clockOut: now, hoursWorked: Math.round(hours * 100) / 100 },
    });
  }

  async deleteAttendance(id: string) {
    return this.prisma.attendanceRecord.delete({ where: { id } });
  }

  // ─── Leave ───────────────────────────────────────────────────────────────────

  async getLeaves(branchId: string, status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: { branchId, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeave(dto: {
    branchId: string;
    staffId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    const staff = await this.prisma.branchManager.findUnique({ where: { id: dto.staffId } });
    if (!staff) throw new NotFoundException('ไม่พบพนักงาน');
    const days = this.dateDiff(dto.startDate, dto.endDate);
    return this.prisma.leaveRequest.create({
      data: {
        staffId: dto.staffId,
        staffName: staff.name,
        branchId: dto.branchId,
        type: dto.type as any,
        startDate: dto.startDate,
        endDate: dto.endDate,
        days,
        reason: dto.reason,
      },
    });
  }

  async updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED', managerNote?: string) {
    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('ไม่พบใบลา');
    return this.prisma.leaveRequest.update({ where: { id }, data: { status, managerNote } });
  }

  async deleteLeave(id: string) {
    return this.prisma.leaveRequest.delete({ where: { id } });
  }

  // ─── Salary ──────────────────────────────────────────────────────────────────

  async getSalaries(branchId: string) {
    return this.prisma.staffSalary.findMany({
      where: { branchId },
      orderBy: { staffName: 'asc' },
    });
  }

  async upsertSalary(dto: {
    staffId: string;
    branchId: string;
    payType: string;
    baseSalary: number;
    hourlyRate: number;
    socialSec: number;
    tax: number;
  }) {
    const staff = await this.prisma.branchManager.findUnique({ where: { id: dto.staffId } });
    if (!staff) throw new NotFoundException('ไม่พบพนักงาน');
    return this.prisma.staffSalary.upsert({
      where: { staffId: dto.staffId },
      create: { ...dto, staffName: staff.name, payType: dto.payType as any },
      update: { ...dto, staffName: staff.name, payType: dto.payType as any },
    });
  }

  // ─── Payslip ─────────────────────────────────────────────────────────────────

  async getPayslips(branchId: string, year?: number, month?: number) {
    return this.prisma.payslip.findMany({
      where: { branchId, ...(year ? { year } : {}), ...(month ? { month } : {}) },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { staffName: 'asc' }],
    });
  }

  async generatePayslips(branchId: string, year: number, month: number) {
    const salaries = await this.prisma.staffSalary.findMany({ where: { branchId } });

    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const attendance = await this.prisma.attendanceRecord.findMany({
      where: { branchId, date: { gte: fromDate, lte: toDate } },
    });
    const leaves = await this.prisma.leaveRequest.findMany({
      where: { branchId, status: 'APPROVED', startDate: { gte: fromDate }, endDate: { lte: toDate } },
    });

    const results: any[] = [];
    for (const salary of salaries) {
      const staffAtt = attendance.filter(a => a.staffId === salary.staffId);
      const daysWorked = new Set(staffAtt.map(a => a.date)).size;
      const hoursWorked = staffAtt.reduce((s, a) => s + (a.hoursWorked || 0), 0);
      const staffLeaves = leaves.filter(l => l.staffId === salary.staffId);
      const daysLeave = staffLeaves.reduce((s, l) => s + l.days, 0);
      const daysAbsent = Math.max(0, lastDay - daysWorked - daysLeave);

      let basePay = 0;
      if (salary.payType === 'MONTHLY') basePay = salary.baseSalary;
      else if (salary.payType === 'DAILY') basePay = salary.baseSalary * daysWorked;
      else if (salary.payType === 'HOURLY') basePay = salary.hourlyRate * hoursWorked;

      const absenceDeduction = salary.payType === 'MONTHLY' && daysAbsent > 0
        ? (salary.baseSalary / lastDay) * daysAbsent : 0;
      const deductions = salary.socialSec + salary.tax + absenceDeduction;
      const netPay = Math.max(0, basePay - deductions);

      const payslip = await this.prisma.payslip.upsert({
        where: { staffId_month_year: { staffId: salary.staffId, month, year } },
        create: {
          staffId: salary.staffId, staffName: salary.staffName, branchId, month, year,
          baseSalary: Math.round(basePay * 100) / 100,
          deductions: Math.round(deductions * 100) / 100,
          netPay: Math.round(netPay * 100) / 100,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          daysWorked, daysAbsent, daysLeave,
        },
        update: {
          staffName: salary.staffName,
          baseSalary: Math.round(basePay * 100) / 100,
          deductions: Math.round(deductions * 100) / 100,
          netPay: Math.round(netPay * 100) / 100,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          daysWorked, daysAbsent, daysLeave,
        },
      });
      results.push(payslip);
    }
    return results;
  }

  async markPayslipPaid(id: string) {
    return this.prisma.payslip.update({ where: { id }, data: { paidAt: new Date() } });
  }

  // ─── Staff Schedule ────────────────────────────────────────────────────────
  async getSchedules(branchId: string, startDate?: string, endDate?: string) {
    return this.prisma.staffSchedule.findMany({
      where: {
        branchId,
        ...(startDate && endDate ? { date: { gte: startDate, lte: endDate } } : startDate ? { date: { gte: startDate } } : endDate ? { date: { lte: endDate } } : {}),
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async createSchedule(dto: {
    id?: string;
    branchId: string;
    staffId: string;
    date: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    note?: string;
  }) {
    const staff = await this.prisma.branchManager.findUnique({ where: { id: dto.staffId } });
    if (!staff) throw new NotFoundException('ไม่พบพนักงาน');

    if (dto.id) {
      return this.prisma.staffSchedule.update({
        where: { id: dto.id },
        data: {
          staffId: dto.staffId,
          staffName: staff.name,
          date: dto.date,
          shiftType: dto.shiftType,
          startTime: dto.startTime,
          endTime: dto.endTime,
          note: dto.note,
        },
      });
    }

    return this.prisma.staffSchedule.upsert({
      where: {
        branchId_staffId_date: {
          branchId: dto.branchId,
          staffId: dto.staffId,
          date: dto.date,
        },
      },
      create: {
        branchId: dto.branchId,
        staffId: dto.staffId,
        staffName: staff.name,
        date: dto.date,
        shiftType: dto.shiftType,
        startTime: dto.startTime,
        endTime: dto.endTime,
        note: dto.note,
      },
      update: {
        shiftType: dto.shiftType,
        startTime: dto.startTime,
        endTime: dto.endTime,
        note: dto.note,
      },
    });
  }

  async createBulkSchedule(dto: {
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
    const staff = await this.prisma.branchManager.findUnique({ where: { id: dto.staffId } });
    if (!staff) throw new NotFoundException('ไม่พบพนักงาน');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const dateArray: Date[] = [];
    let current = new Date(start);

    let limit = 0;
    while (current <= end && limit < 366) {
      dateArray.push(new Date(current));
      current.setDate(current.getDate() + 1);
      limit++;
    }

    const records: any[] = [];

    for (const d of dateArray) {
      const dayOfWeek = d.getDay();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const isWorkDay = dto.workDays.includes(dayOfWeek);
      const isOffDay = dto.offDays.includes(dayOfWeek);

      if (!isWorkDay && !isOffDay) {
        continue;
      }

      const shiftType = isOffDay ? 'OFF_DAY' : dto.shiftType;
      const startTime = isOffDay ? '00:00' : dto.startTime;
      const endTime = isOffDay ? '00:00' : dto.endTime;

      const record = await this.prisma.staffSchedule.upsert({
        where: {
          branchId_staffId_date: {
            branchId: dto.branchId,
            staffId: dto.staffId,
            date: dateStr,
          },
        },
        create: {
          branchId: dto.branchId,
          staffId: dto.staffId,
          staffName: staff.name,
          date: dateStr,
          shiftType,
          startTime,
          endTime,
          note: dto.note,
        },
        update: {
          shiftType,
          startTime,
          endTime,
          note: dto.note,
        },
      });
      records.push(record);
    }

    return records;
  }

  async deleteSchedule(id: string) {
    const schedule = await this.prisma.staffSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('ไม่พบตารางงาน');
    return this.prisma.staffSchedule.delete({ where: { id } });
  }

  // ─── Monthly Plan / Events ──────────────────────────────────────────────────
  async getMonthlyPlans(branchId: string, startDate?: string, endDate?: string) {
    return this.prisma.monthlyPlan.findMany({
      where: {
        branchId,
        ...(startDate && endDate ? { date: { gte: startDate, lte: endDate } } : startDate ? { date: { gte: startDate } } : endDate ? { date: { lte: endDate } } : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  async createMonthlyPlan(dto: {
    id?: string;
    branchId: string;
    title: string;
    date: string;
    note?: string;
  }) {
    if (dto.id) {
      return this.prisma.monthlyPlan.update({
        where: { id: dto.id },
        data: {
          title: dto.title,
          date: dto.date,
          note: dto.note,
        },
      });
    }

    return this.prisma.monthlyPlan.create({
      data: {
        branchId: dto.branchId,
        title: dto.title,
        date: dto.date,
        note: dto.note,
      },
    });
  }

  async deleteMonthlyPlan(id: string) {
    const plan = await this.prisma.monthlyPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('ไม่พบแผนงาน');
    return this.prisma.monthlyPlan.delete({ where: { id } });
  }

  // ─── Mobile Public Attendance ──────────────────────────────────────────────
  async getPublicBranchStaff(branchId: string) {
    return this.prisma.branchManager.findMany({
      where: { branchId, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async mobileClock(branchId: string, pin: string) {
    const staff = await this.prisma.branchManager.findFirst({
      where: { branchId, pin, isActive: true },
    });
    if (!staff) throw new BadRequestException('PIN ไม่ถูกต้องหรือพนักงานไม่ได้เปิดใช้งาน');

    const today = this.today();
    const activeRecord = await this.prisma.attendanceRecord.findFirst({
      where: { staffId: staff.id, date: today, clockOut: null },
    });

    if (activeRecord) {
      // Clock out
      const now = new Date();
      const hours = (now.getTime() - activeRecord.clockIn.getTime()) / 3_600_000;
      const updated = await this.prisma.attendanceRecord.update({
        where: { id: activeRecord.id },
        data: { clockOut: now, hoursWorked: Math.round(hours * 100) / 100 },
      });
      return {
        type: 'CLOCK_OUT',
        staffName: staff.name,
        time: now,
        record: updated,
      };
    } else {
      // Clock in
      const record = await this.prisma.attendanceRecord.create({
        data: {
          staffId: staff.id,
          staffName: staff.name,
          branchId,
          date: today,
          clockIn: new Date(),
        },
      });
      return {
        type: 'CLOCK_IN',
        staffName: staff.name,
        time: record.clockIn,
        record,
      };
    }
  }
}
