import { Prisma } from '@prisma/client';
import { toDateOnly, type TransactionDto } from '@coinbook/shared';

export const transactionInclude = {
  wallet: { select: { id: true, name: true } },
  toWallet: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, icon: true } },
} satisfies Prisma.TransactionInclude;

export type TransactionWithRefs = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export function toTransactionDto(
  t: TransactionWithRefs,
  balanceAfter: number | null = null,
): TransactionDto {
  return {
    id: t.id,
    type: t.type,
    amount: t.amount,
    date: toDateOnly(t.date),
    description: t.description,
    note: t.note,
    source: t.source,
    wallet: t.wallet,
    toWallet: t.toWallet,
    category: t.category,
    balanceAfter,
  };
}
