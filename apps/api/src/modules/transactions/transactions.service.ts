import { Injectable } from '@nestjs/common';
import type { Category, Prisma, Transaction, TransactionType, Wallet } from '@prisma/client';
import {
  fromDateOnly,
  type CreateTransactionInput,
  type ListTransactionsQuery,
  type Paginated,
  type TransactionDto,
  type UpdateTransactionInput,
} from '@coinbook/shared';
import { AppError } from '../../common/errors/app-error';
import { PrismaService } from '../../database/prisma.service';
import { ledgerCountSql, ledgerFilterSql, ledgerSql, type LedgerRow } from './ledger.query';
import { toTransactionDto, transactionInclude } from './transactions.mapper';

type Db = Prisma.TransactionClient;

interface Movement {
  type: TransactionType;
  amount: number;
  walletId: string;
  toWalletId: string | null;
}

function addMovement(acc: Map<string, number>, m: Movement, sign: 1 | -1): void {
  const add = (id: string, delta: number): void => {
    acc.set(id, (acc.get(id) ?? 0) + delta * sign);
  };
  if (m.type === 'INCOME') add(m.walletId, m.amount);
  else add(m.walletId, -m.amount);
  if (m.type === 'TRANSFER' && m.toWalletId) add(m.toWalletId, m.amount);
}

async function applyBalances(db: Db, acc: Map<string, number>): Promise<void> {
  for (const [id, delta] of acc) {
    if (delta !== 0)
      await db.wallet.update({ where: { id }, data: { balance: { increment: delta } } });
  }
}

function required(value: string | null | undefined, field: string): string {
  if (!value) throw new AppError('VALIDATION_ERROR', `Missing ${field}`, { [field]: 'required' });
  return value;
}

function describe(
  type: TransactionType,
  note: string | null,
  wallet: Wallet,
  toWallet: Wallet | null,
  category: Category | null,
): string {
  if (note) return note;
  if (type === 'TRANSFER') return `Transfer ${wallet.name} ke ${toWallet?.name ?? ''}`.trim();
  return category?.name ?? '';
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListTransactionsQuery): Promise<Paginated<TransactionDto>> {
    const { page, pageSize, ...filters } = query;
    const where = ledgerFilterSql(filters);
    const totalBalance = await this.prisma.wallet.aggregate({
      where: { userId },
      _sum: { balance: true },
    });
    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<LedgerRow[]>(
        ledgerSql(userId, totalBalance._sum.balance ?? 0, where, pageSize, (page - 1) * pageSize),
      ),
      this.prisma.$queryRaw<{ count: number }[]>(ledgerCountSql(userId, where)),
    ]);
    const records = await this.prisma.transaction.findMany({
      where: { id: { in: rows.map((r) => r.id) } },
      include: transactionInclude,
    });
    const byId = new Map(records.map((r) => [r.id, r]));
    const data = rows.flatMap((r) => {
      const record = byId.get(r.id);
      return record ? [toTransactionDto(record, r.balance_after)] : [];
    });
    const total = countRows[0]?.count ?? 0;
    return { data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async recent(userId: string, limit: number): Promise<TransactionDto[]> {
    const result = await this.list(userId, { page: 1, pageSize: limit });
    return result.data;
  }

  create(userId: string, input: CreateTransactionInput): Promise<TransactionDto> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.usableWallet(tx, userId, input.walletId);
      let toWallet: Wallet | null = null;
      let category: Category | null = null;
      if (input.type === 'TRANSFER') {
        if (input.toWalletId === input.walletId) {
          throw new AppError('SAME_WALLET', 'Source and destination wallets must differ');
        }
        toWallet = await this.usableWallet(tx, userId, input.toWalletId);
      } else {
        category = await this.matchingCategory(tx, userId, input.categoryId, input.type);
      }
      const note = input.note || null;
      const row = await tx.transaction.create({
        data: {
          userId,
          type: input.type,
          amount: input.amount,
          walletId: wallet.id,
          toWalletId: toWallet?.id ?? null,
          categoryId: category?.id ?? null,
          date: fromDateOnly(input.date),
          description: describe(input.type, note, wallet, toWallet, category),
          note,
          source: 'MANUAL',
        },
        include: transactionInclude,
      });
      const acc = new Map<string, number>();
      addMovement(acc, row, 1);
      await applyBalances(tx, acc);
      return toTransactionDto(row);
    });
  }

  update(userId: string, id: string, input: UpdateTransactionInput): Promise<TransactionDto> {
    return this.prisma.$transaction(async (tx) => {
      const old = await this.lockOwned(tx, userId, id);
      const note = input.note === undefined ? old.note : input.note || null;

      if (old.source !== 'MANUAL') {
        const touched = Object.keys(input).filter((k) => k !== 'note');
        if (touched.length > 0) {
          throw new AppError(
            'TRANSACTION_LOCKED',
            'Only the note of bill or split transactions can change',
          );
        }
        const row = await tx.transaction.update({
          where: { id },
          data: { note },
          include: transactionInclude,
        });
        return toTransactionDto(row);
      }

      if (old.type === 'TRANSFER' && input.categoryId) {
        throw new AppError('VALIDATION_ERROR', 'Transfers have no category', {
          categoryId: 'not allowed',
        });
      }
      if (old.type !== 'TRANSFER' && input.toWalletId) {
        throw new AppError('VALIDATION_ERROR', 'Only transfers have a destination wallet', {
          toWalletId: 'not allowed',
        });
      }

      const walletId = input.walletId ?? old.walletId;
      const wallet =
        walletId === old.walletId
          ? await this.ownedWallet(tx, userId, walletId)
          : await this.usableWallet(tx, userId, walletId);

      let toWallet: Wallet | null = null;
      let category: Category | null = null;
      if (old.type === 'TRANSFER') {
        const toWalletId = required(input.toWalletId ?? old.toWalletId, 'toWalletId');
        if (toWalletId === walletId) {
          throw new AppError('SAME_WALLET', 'Source and destination wallets must differ');
        }
        toWallet =
          toWalletId === old.toWalletId
            ? await this.ownedWallet(tx, userId, toWalletId)
            : await this.usableWallet(tx, userId, toWalletId);
      } else {
        category = await this.matchingCategory(
          tx,
          userId,
          required(input.categoryId ?? old.categoryId, 'categoryId'),
          old.type,
        );
      }

      const amount = input.amount ?? old.amount;
      const row = await tx.transaction.update({
        where: { id },
        data: {
          amount,
          walletId: wallet.id,
          toWalletId: toWallet?.id ?? null,
          categoryId: category?.id ?? null,
          date: input.date ? fromDateOnly(input.date) : old.date,
          description: describe(old.type, note, wallet, toWallet, category),
          note,
        },
        include: transactionInclude,
      });
      const acc = new Map<string, number>();
      addMovement(acc, old, -1);
      addMovement(acc, row, 1);
      await applyBalances(tx, acc);
      return toTransactionDto(row);
    });
  }

  remove(userId: string, id: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const old = await this.lockOwned(tx, userId, id);
      if (old.source !== 'MANUAL') {
        throw new AppError('TRANSACTION_LOCKED', 'Bill and split transactions cannot be deleted');
      }
      await tx.transaction.delete({ where: { id } });
      const acc = new Map<string, number>();
      addMovement(acc, old, -1);
      await applyBalances(tx, acc);
    });
  }

  private async lockOwned(db: Db, userId: string, id: string): Promise<Transaction> {
    const locked = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Transaction" WHERE id = ${id}::uuid AND "userId" = ${userId}::uuid FOR UPDATE`;
    if (locked.length === 0) throw AppError.notFound('Transaction');
    return db.transaction.findUniqueOrThrow({ where: { id } });
  }

  private async ownedWallet(db: Db, userId: string, id: string): Promise<Wallet> {
    const wallet = await db.wallet.findFirst({ where: { id, userId } });
    if (!wallet) throw AppError.notFound('Wallet');
    return wallet;
  }

  private async usableWallet(db: Db, userId: string, id: string): Promise<Wallet> {
    const wallet = await this.ownedWallet(db, userId, id);
    if (wallet.isArchived)
      throw new AppError('WALLET_ARCHIVED', `Wallet ${wallet.name} is archived`);
    return wallet;
  }

  private async matchingCategory(
    db: Db,
    userId: string,
    id: string,
    type: TransactionType,
  ): Promise<Category> {
    const category = await db.category.findFirst({ where: { id, userId } });
    if (!category) throw AppError.notFound('Category');
    if (category.type !== type) {
      throw new AppError('VALIDATION_ERROR', 'Category type does not match transaction type', {
        categoryId: 'type mismatch',
      });
    }
    return category;
  }
}
