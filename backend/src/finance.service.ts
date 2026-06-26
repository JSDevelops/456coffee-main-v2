import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export class CreateCashflowDto {
  branchId: string;
  type: string;
  category: string;
  amount: number;
  note?: string;
  referenceId?: string;
  createdBy?: string;
}

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(data: CreateCashflowDto) {
    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    
    return this.prisma.cashflowTransaction.create({
      data: {
        branchId: data.branchId,
        type: data.type, // INCOME | EXPENSE
        category: data.category,
        amount: data.amount,
        note: data.note,
        referenceId: data.referenceId,
        createdBy: data.createdBy,
      }
    });
  }

  async getTransactions(filters: { branchId?: string; type?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.type) where.type = filters.type;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    return this.prisma.cashflowTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSummary(filters: { branchId?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const transactions = await this.prisma.cashflowTransaction.findMany({ where });
    
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'INCOME') totalIncome += tx.amount;
      else if (tx.type === 'EXPENSE') totalExpense += tx.amount;
    });

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense
    };
  }
}
