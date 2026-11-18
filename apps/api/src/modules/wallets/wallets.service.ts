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
import { toWalletDto } from './wallets.mapper';

type Db = Prisma.TransactionClient;

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
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
    if (input.fromWalletId === input.toWalletId) {
      throw new AppError('SAME_WALLET', 'Source and destination wallets must differ');
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const from = await this.usable(tx, userId, input.fromWalletId);
      const to = await this.usable(tx, userId, input.toWalletId);
      const created = await tx.transaction.create({
        data: {
          userId,
          type: 'TRANSFER',
          amount: input.amount,
          walletId: from.id,
          toWalletId: to.id,
          date: fromDateOnly(input.date),
          description: input.note || `Transfer ${from.name} ke ${to.name}`,
          note: input.note || null,
          source: 'MANUAL',
        },
      });
      const fromAfter = await tx.wallet.update({
        where: { id: from.id },
        data: { balance: { decrement: input.amount } },
      });
      const toAfter = await tx.wallet.update({
        where: { id: to.id },
        data: { balance: { increment: input.amount } },
      });
      return { transactionId: created.id, fromAfter, toAfter };
    });
    return {
      transactionId: result.transactionId,
      from: await this.withCount(userId, result.fromAfter),
      to: await this.withCount(userId, result.toAfter),
    };
  }

  private async owned(db: Db, userId: string, id: string): Promise<Wallet> {
    const wallet = await db.wallet.findFirst({ where: { id, userId } });
    if (!wallet) throw AppError.notFound('Wallet');
    return wallet;
  }

  private async usable(db: Db, userId: string, id: string): Promise<Wallet> {
    const wallet = await this.owned(db, userId, id);
    if (wallet.isArchived) {
      throw new AppError('WALLET_ARCHIVED', `Wallet ${wallet.name} is archived`);
    }
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
