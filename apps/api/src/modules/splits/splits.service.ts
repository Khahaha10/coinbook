import { Inject, Injectable } from '@nestjs/common';
import type { Prisma, Split } from '@prisma/client';
import {
  calculateSplit,
  fromDateOnly,
  SplitCalcError,
  toDateOnly,
  type ConfirmDebtInput,
  type CreateSplitInput,
  type SplitCalcResult,
  type SplitDetailDto,
  type SplitListDto,
} from '@coinbook/shared';
import { businessToday } from '../../common/clock';
import { AppError } from '../../common/errors/app-error';
import { generateShareToken } from '../../common/share-token';
import { ENV, type Env } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { debtTotals, splitDetailInclude, toSplitDetailDto } from './splits.mapper';

type Db = Prisma.TransactionClient;

const SPLIT_CATEGORY_NAME = 'Makan & minum';
const TOKEN_ATTEMPTS = 5;

const CREATE_TIMEOUT_MS = 15_000;

function requireId(ids: Map<string, string>, key: string): string {
  const id = ids.get(key);
  if (!id)
    throw new AppError('VALIDATION_ERROR', `Unknown person key ${key}`, {
      items: 'unknown person',
    });
  return id;
}

function calculate(input: CreateSplitInput): SplitCalcResult {
  try {
    return calculateSplit({
      people: input.people,
      items: input.items,
      taxBps: input.taxBps,
      serviceBps: input.serviceBps,
      discountType: input.discountType,
      discountValue: input.discountValue,
    });
  } catch (e) {
    if (!(e instanceof SplitCalcError)) throw e;
    if (e.code === 'ITEM_UNASSIGNED') throw new AppError('ITEM_UNASSIGNED', e.message);
    throw new AppError('VALIDATION_ERROR', e.message, { _: e.code });
  }
}

@Injectable()
export class SplitsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async list(userId: string): Promise<SplitListDto> {
    const splits = await this.prisma.split.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        people: { orderBy: { sortOrder: 'asc' }, include: { debt: true } },
      },
    });
    const receivables = splits.flatMap((s) =>
      s.people.flatMap((p) =>
        p.debt && p.debt.status !== 'PAID'
          ? [
              {
                personId: p.id,
                splitId: s.id,
                splitTitle: s.title,
                name: p.name,
                amount: p.debt.amount,
                status: p.debt.status,
              },
            ]
          : [],
      ),
    );
    return {
      data: splits.map((s) => {
        const totals = debtTotals(s.people.flatMap((p) => (p.debt ? [p.debt] : [])));
        return {
          id: s.id,
          title: s.title,
          date: toDateOnly(s.date),
          grandTotal: s.grandTotal,
          paidCount: totals.paidCount,
          peopleCount: totals.peopleCount,
          status: totals.status,
        };
      }),
      receivables,
      receivablesTotal: receivables.reduce((sum, r) => sum + r.amount, 0),
    };
  }

  async detail(userId: string, id: string): Promise<SplitDetailDto> {
    const split = await this.prisma.split.findFirst({
      where: { id, userId },
      include: splitDetailInclude,
    });
    if (!split) throw AppError.notFound('Split');
    return toSplitDetailDto(split, this.env.APP_URL);
  }

  async create(userId: string, input: CreateSplitInput): Promise<SplitDetailDto> {
    const calc = calculate(input);
    const splitId = await this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findFirst({ where: { id: input.walletId, userId } });
        if (!wallet) throw AppError.notFound('Wallet');
        if (wallet.isArchived) {
          throw new AppError('WALLET_ARCHIVED', `Wallet ${wallet.name} is archived`);
        }
        const expenseTransactionId = await this.createExpense(tx, userId, input, calc.grandTotal);
        const shares = new Map(calc.people.map((p) => [p.key, p.share]));
        const split = await tx.split.create({
          data: {
            userId,
            title: input.title,
            date: fromDateOnly(input.date),
            walletId: wallet.id,
            taxBps: input.taxBps,
            serviceBps: input.serviceBps,
            discountType: input.discountType,
            discountValue: input.discountValue,
            subtotal: calc.subtotal,
            grandTotal: calc.grandTotal,
            shareToken: await this.uniqueToken(tx),
            expenseTransactionId,
          },
        });

        const personIds = new Map<string, string>();
        for (const [i, p] of input.people.entries()) {
          const share = shares.get(p.key) ?? 0;
          const person = await tx.splitPerson.create({
            data: { splitId: split.id, name: p.name, isOwner: p.isOwner, share, sortOrder: i },
          });
          personIds.set(p.key, person.id);
          if (!p.isOwner) {
            await tx.debt.create({
              data: {
                personId: person.id,
                amount: share,
                status: share === 0 ? 'PAID' : 'UNPAID',
                confirmedAt: share === 0 ? new Date() : null,
              },
            });
          }
        }

        for (const [i, it] of input.items.entries()) {
          const item = await tx.splitItem.create({
            data: { splitId: split.id, name: it.name, price: it.price, qty: it.qty, sortOrder: i },
          });
          await tx.splitAssignment.createMany({
            data: [...new Set(it.personKeys)].map((k) => ({
              itemId: item.id,
              personId: requireId(personIds, k),
            })),
          });
        }
        return split.id;
      },
      { timeout: CREATE_TIMEOUT_MS },
    );
    return this.detail(userId, splitId);
  }

  async confirm(
    userId: string,
    splitId: string,
    personId: string,
    input: ConfirmDebtInput,
  ): Promise<SplitDetailDto> {
    const today = businessToday(this.env);
    await this.prisma.$transaction(async (tx) => {
      const split = await this.lockSplit(tx, userId, splitId);
      const person = await tx.splitPerson.findFirst({
        where: { id: personId, splitId, isOwner: false },
      });
      if (!person) throw AppError.notFound('Person');
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Debt" WHERE "personId" = ${personId}::uuid FOR UPDATE`;
      if (locked.length === 0) throw AppError.notFound('Debt');
      const debt = await tx.debt.findUniqueOrThrow({ where: { personId } });
      if (debt.status === 'PAID') {
        throw new AppError('DEBT_ALREADY_PAID', `${person.name} has already paid`);
      }
      const walletId = input.walletId ?? split.walletId;
      const wallet = await tx.wallet.findFirst({ where: { id: walletId, userId } });
      if (!wallet) throw AppError.notFound('Wallet');
      if (wallet.isArchived) {
        throw new AppError('WALLET_ARCHIVED', `Wallet ${wallet.name} is archived`);
      }
      const income = await tx.transaction.create({
        data: {
          userId,
          type: 'INCOME',
          amount: debt.amount,
          walletId,
          date: fromDateOnly(today),
          description: `Patungan dari ${person.name}`,
          source: 'SPLIT',
        },
      });
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: debt.amount } },
      });
      await tx.debt.update({
        where: { personId },
        data: { status: 'PAID', confirmedAt: new Date(), walletId, transactionId: income.id },
      });
    });
    return this.detail(userId, splitId);
  }

  async remove(userId: string, splitId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const split = await this.lockSplit(tx, userId, splitId);
      const paid = await tx.debt.count({
        where: { person: { splitId }, status: 'PAID', amount: { gt: 0 } },
      });
      if (paid > 0) {
        throw new AppError(
          'DEBT_ALREADY_PAID',
          'A split with confirmed payments cannot be deleted',
        );
      }
      await tx.split.delete({ where: { id: splitId } });
      if (split.expenseTransactionId) {
        const expense = await tx.transaction.delete({ where: { id: split.expenseTransactionId } });
        await tx.wallet.update({
          where: { id: expense.walletId },
          data: { balance: { increment: expense.amount } },
        });
      }
    });
  }

  private async lockSplit(tx: Db, userId: string, splitId: string): Promise<Split> {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Split" WHERE id = ${splitId}::uuid AND "userId" = ${userId}::uuid FOR UPDATE`;
    if (locked.length === 0) throw AppError.notFound('Split');
    return tx.split.findUniqueOrThrow({ where: { id: splitId } });
  }

  private async createExpense(
    tx: Db,
    userId: string,
    input: CreateSplitInput,
    grandTotal: number,
  ): Promise<string | null> {
    if (grandTotal === 0) return null;
    const category = await tx.category.findFirst({
      where: { userId, name: SPLIT_CATEGORY_NAME, type: 'EXPENSE' },
    });
    const expense = await tx.transaction.create({
      data: {
        userId,
        type: 'EXPENSE',
        amount: grandTotal,
        walletId: input.walletId,
        categoryId: category?.id ?? null,
        date: fromDateOnly(input.date),
        description: input.title,
        source: 'SPLIT',
      },
    });
    await tx.wallet.update({
      where: { id: input.walletId },
      data: { balance: { decrement: grandTotal } },
    });
    return expense.id;
  }

  private async uniqueToken(tx: Db): Promise<string> {
    for (let attempt = 0; attempt < TOKEN_ATTEMPTS; attempt++) {
      const token = generateShareToken();
      const taken = await tx.split.findUnique({ where: { shareToken: token } });
      if (!taken) return token;
    }
    throw new AppError('INTERNAL_ERROR', 'Could not generate a share token');
  }
}
