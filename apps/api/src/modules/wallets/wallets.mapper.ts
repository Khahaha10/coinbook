import type { Wallet } from '@prisma/client';
import type { WalletDto } from '@coinbook/shared';

export function toWalletDto(w: Wallet, transactionCountThisMonth: number): WalletDto {
  return {
    id: w.id,
    name: w.name,
    type: w.type,
    balance: w.balance,
    isArchived: w.isArchived,
    sortOrder: w.sortOrder,
    transactionCountThisMonth,
  };
}
