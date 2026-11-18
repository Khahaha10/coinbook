import { Inject, Injectable } from '@nestjs/common';
import type { Prisma, Wallet } from '@prisma/client';
import {
  fromDateOnly,
  monthOf,
  monthRange,
  type CreateWalletInput,
  type TransferInput,
  type TransferResultDto,
  type UpdateWalletInput,
  type WalletDto,
  type WalletListDto,
} from '@coinbook/shared';
import { businessToday } from '../../common/clock';
import { AppError } from '../../common/errors/app-error';
import { ENV, type Env } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { toWalletDto } from './wallets.mapper';

type Db = Prisma.TransactionClient;

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
    private readonly transactions: TransactionsService,
  ) {}

  async list(userId: string): Promise<WalletListDto> {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const counts = await this.monthCounts(userId);
    return {
      data: wallets.map((w) => toWalletDto(w, counts.get(w.id) ?? 0)),
      total: wallets.reduce((sum, w) => sum + w.balance, 0),
    };
  }

  async create(userId: string, input: CreateWalletInput): Promise<WalletDto> {
    const sortOrder = await this.prisma.wallet.count({ where: { userId } });
    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        openingBalance: input.openingBalance,
        balance: input.openingBalance,
        sortOrder,
      },
    });
    return toWalletDto(wallet, 0);
  }

  async update(userId: string, id: string, input: UpdateWalletInput): Promise<WalletDto> {
    await this.owned(this.prisma, userId, id);
    const wallet = await this.prisma.wallet.update({ where: { id }, data: input });
    return this.withCount(userId, wallet);
  }

  async archive(userId: string, id: string): Promise<WalletDto> {
    await this.owned(this.prisma, userId, id);
    const wallet = await this.prisma.wallet.update({ where: { id }, data: { isArchived: true } });
    return this.withCount(userId, wallet);
  }

  async transfer(userId: string, input: TransferInput): Promise<TransferResultDto> {
    const created = await this.transactions.create(userId, {
      type: 'TRANSFER',
      amount: input.amount,
      walletId: input.fromWalletId,
      toWalletId: input.toWalletId,
      date: input.date,
      note: input.note,
    });
    const [from, to] = await Promise.all([
      this.prisma.wallet.findUniqueOrThrow({ where: { id: input.fromWalletId } }),
      this.prisma.wallet.findUniqueOrThrow({ where: { id: input.toWalletId } }),
    ]);
    return {
      transactionId: created.id,
      from: await this.withCount(userId, from),
      to: await this.withCount(userId, to),
    };
  }

  private async owned(db: Db, userId: string, id: string): Promise<Wallet> {
    const wallet = await db.wallet.findFirst({ where: { id, userId } });
    if (!wallet) throw AppError.notFound('Wallet');
    return wallet;
  }

  private async withCount(userId: string, wallet: Wallet): Promise<WalletDto> {
    const counts = await this.monthCounts(userId);
    return toWalletDto(wallet, counts.get(wallet.id) ?? 0);
  }

  private async monthCounts(userId: string): Promise<Map<string, number>> {
    const { from, to } = monthRange(monthOf(businessToday(this.env)));
    const date = { gte: fromDateOnly(from), lte: fromDateOnly(to) };
    const [outgoing, incoming] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['walletId'],
        where: { userId, date },
        _count: { _all: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['toWalletId'],
        where: { userId, date, toWalletId: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const counts = new Map<string, number>();
    for (const row of outgoing) counts.set(row.walletId, row._count._all);
    for (const row of incoming) {
      if (row.toWalletId) {
        counts.set(row.toWalletId, (counts.get(row.toWalletId) ?? 0) + row._count._all);
      }
    }
    return counts;
  }
}
