import { z } from 'zod';
import type { DateOnly } from '../utils/dates';
import type { TransactionSource, TransactionType } from '../types/enums';
import {
  dateOnlySchema,
  idSchema,
  noteSchema,
  paginationQuerySchema,
  positiveRupiahSchema,
  transactionTypeSchema,
} from './common';

const base = {
  amount: positiveRupiahSchema,
  walletId: idSchema,
  date: dateOnlySchema,
  note: noteSchema.optional(),
};

export const createTransactionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('EXPENSE'), categoryId: idSchema, ...base }).strict(),
  z.object({ type: z.literal('INCOME'), categoryId: idSchema, ...base }).strict(),
  z.object({ type: z.literal('TRANSFER'), toWalletId: idSchema, ...base }).strict(),
]);
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = z
  .object({
    amount: positiveRupiahSchema,
    walletId: idSchema,
    toWalletId: idSchema,
    categoryId: idSchema,
    date: dateOnlySchema,
    note: noteSchema.nullable(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export interface TransactionDto {
  id: string;
  type: TransactionType;
  amount: number;
  date: DateOnly;
  description: string;
  note: string | null;
  source: TransactionSource;
  wallet: { id: string; name: string };
  toWallet: { id: string; name: string } | null;
  category: { id: string; name: string; icon: string } | null;
  balanceAfter: number | null;
}

export const listTransactionsQuerySchema = paginationQuerySchema
  .extend({
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    walletId: idSchema.optional(),
    categoryId: idSchema.optional(),
    type: transactionTypeSchema.optional(),
    q: z.string().trim().max(100).optional(),
  })
  .strict()
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: 'from must be before to',
    path: ['to'],
  });
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

export const recentTransactionsQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(20).default(5) })
  .strict();
export type RecentTransactionsQuery = z.infer<typeof recentTransactionsQuerySchema>;
