import { Inject, Injectable } from '@nestjs/common';
import type { Bill } from '@prisma/client';
import {
  fromDateOnly,
  monthlyEquivalent,
  type BillDto,
  type BillListDto,
  type CreateBillInput,
  type UpdateBillInput,
} from '@coinbook/shared';
import { businessToday } from '../../common/clock';
import { AppError } from '../../common/errors/app-error';
import { ENV, type Env } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { billInclude, toBillDto } from './bills.mapper';

function anchorOf(dueDate: string): number {
  return Number(dueDate.slice(8, 10));
}

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async list(userId: string): Promise<BillListDto> {
    const bills = await this.prisma.bill.findMany({
      where: { userId, isActive: true },
      include: billInclude,
      orderBy: [{ nextDueDate: 'asc' }, { createdAt: 'asc' }],
    });
    const today = businessToday(this.env);
    return {
      data: bills.map((b) => toBillDto(b, today)),
      monthlyTotal: bills.reduce((sum, b) => sum + monthlyEquivalent(b.amount, b.cycle), 0),
      activeCount: bills.length,
    };
  }

  async create(userId: string, input: CreateBillInput): Promise<BillDto> {
    await this.usableWallet(userId, input.walletId);
    await this.expenseCategory(userId, input.categoryId);
    const remindDays =
      input.remindDays ??
      (await this.prisma.profile.findUniqueOrThrow({ where: { id: userId } })).defaultRemindDays;
    const bill = await this.prisma.bill.create({
      data: {
        userId,
        name: input.name,
        amount: input.amount,
        cycle: input.cycle,
        anchorDay: anchorOf(input.dueDate),
        nextDueDate: fromDateOnly(input.dueDate),
        walletId: input.walletId,
        categoryId: input.categoryId,
        remindDays,
      },
      include: billInclude,
    });
    return toBillDto(bill, businessToday(this.env));
  }

  async update(userId: string, id: string, input: UpdateBillInput): Promise<BillDto> {
    const current = await this.owned(userId, id);
    if (input.walletId && input.walletId !== current.walletId) {
      await this.usableWallet(userId, input.walletId);
    }
    if (input.categoryId) await this.expenseCategory(userId, input.categoryId);
    const { dueDate, ...rest } = input;
    const bill = await this.prisma.bill.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate ? { anchorDay: anchorOf(dueDate), nextDueDate: fromDateOnly(dueDate) } : {}),
      },
      include: billInclude,
    });
    return toBillDto(bill, businessToday(this.env));
  }

  async deactivate(userId: string, id: string): Promise<BillDto> {
    await this.owned(userId, id);
    const bill = await this.prisma.bill.update({
      where: { id },
      data: { isActive: false },
      include: billInclude,
    });
    return toBillDto(bill, businessToday(this.env));
  }

  private async owned(userId: string, id: string): Promise<Bill> {
    const bill = await this.prisma.bill.findFirst({ where: { id, userId } });
    if (!bill) throw AppError.notFound('Bill');
    return bill;
  }

  private async usableWallet(userId: string, id: string): Promise<void> {
    const wallet = await this.prisma.wallet.findFirst({ where: { id, userId } });
    if (!wallet) throw AppError.notFound('Wallet');
    if (wallet.isArchived)
      throw new AppError('WALLET_ARCHIVED', `Wallet ${wallet.name} is archived`);
  }

  private async expenseCategory(userId: string, id: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw AppError.notFound('Category');
    if (category.type !== 'EXPENSE') {
      throw new AppError('VALIDATION_ERROR', 'Bills need an expense category', {
        categoryId: 'type mismatch',
      });
    }
  }
}
