import { Inject, Injectable } from '@nestjs/common';
import type { Bill } from '@prisma/client';
import {
  billStatus,
  fromDateOnly,
  monthlyEquivalent,
  monthRange,
  nextDueDate,
  toDateOnly,
  type BillCalendarDto,
  type BillCalendarMarker,
  type BillDto,
  type BillListDto,
  type BillPaymentDto,
  type CreateBillInput,
  type PayBillInput,
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

  pay(userId: string, id: string, input: PayBillInput): Promise<BillDto> {
    const today = businessToday(this.env);
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Bill" WHERE id = ${id}::uuid AND "userId" = ${userId}::uuid FOR UPDATE`;
      if (locked.length === 0) throw AppError.notFound('Bill');
      const bill = await tx.bill.findUniqueOrThrow({ where: { id }, include: billInclude });
      if (!bill.isActive) {
        throw new AppError('VALIDATION_ERROR', 'Bill is inactive', { id: 'inactive' });
      }
      const dueDate = toDateOnly(bill.nextDueDate);
      const lastPaid = bill.payments[0];
      const alreadyPaid = input.dueDate
        ? input.dueDate !== dueDate
        : billStatus({
            nextDueDate: dueDate,
            lastPaidDueDate: lastPaid ? toDateOnly(lastPaid.dueDate) : null,
            today,
          }).status === 'PAID';
      if (alreadyPaid) throw new AppError('BILL_ALREADY_PAID', 'This due date is already paid');

      const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: bill.walletId } });
      if (wallet.isArchived) {
        throw new AppError('WALLET_ARCHIVED', `Wallet ${wallet.name} is archived`);
      }
      const payment = await tx.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount: bill.amount,
          walletId: bill.walletId,
          categoryId: bill.categoryId,
          date: fromDateOnly(today),
          description: bill.name,
          source: 'BILL',
        },
      });
      await tx.wallet.update({
        where: { id: bill.walletId },
        data: { balance: { decrement: bill.amount } },
      });
      await tx.billPayment.create({
        data: { billId: id, transactionId: payment.id, dueDate: bill.nextDueDate },
      });
      const updated = await tx.bill.update({
        where: { id },
        data: { nextDueDate: fromDateOnly(nextDueDate(dueDate, bill.cycle, bill.anchorDay)) },
        include: billInclude,
      });
      return toBillDto(updated, today);
    });
  }

  async payments(userId: string, id: string): Promise<BillPaymentDto[]> {
    await this.owned(userId, id);
    const rows = await this.prisma.billPayment.findMany({
      where: { billId: id },
      orderBy: { dueDate: 'desc' },
      include: { transaction: { include: { wallet: { select: { id: true, name: true } } } } },
    });
    return rows.map((r) => ({
      id: r.id,
      dueDate: toDateOnly(r.dueDate),
      paidAt: r.paidAt.toISOString(),
      amount: r.transaction.amount,
      wallet: r.transaction.wallet,
      transactionId: r.transactionId,
    }));
  }

  async calendar(userId: string, month: string): Promise<BillCalendarDto> {
    const { from, to } = monthRange(month);
    const [bills, paid] = await Promise.all([
      this.prisma.bill.findMany({ where: { userId, isActive: true } }),
      this.prisma.billPayment.findMany({
        where: {
          bill: { userId },
          dueDate: { gte: fromDateOnly(from), lte: fromDateOnly(to) },
        },
        include: { bill: { select: { name: true } } },
      }),
    ]);
    const markers: BillCalendarMarker[] = paid.map((p) => ({
      date: toDateOnly(p.dueDate),
      billId: p.billId,
      name: p.bill.name,
      paid: true,
    }));
    for (const bill of bills) {
      let due = toDateOnly(bill.nextDueDate);
      while (due <= to) {
        if (due >= from) markers.push({ date: due, billId: bill.id, name: bill.name, paid: false });
        due = nextDueDate(due, bill.cycle, bill.anchorDay);
      }
    }
    markers.sort((x, y) => x.date.localeCompare(y.date) || x.name.localeCompare(y.name, 'id'));
    return { month, markers };
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
