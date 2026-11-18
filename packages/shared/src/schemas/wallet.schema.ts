import { z } from 'zod';
import {
  dateOnlySchema,
  idSchema,
  nameSchema,
  noteSchema,
  positiveRupiahSchema,
  rupiahSchema,
  walletTypeSchema,
} from './common';

export const createWalletSchema = z
  .object({
    name: nameSchema,
    type: walletTypeSchema,
    openingBalance: rupiahSchema.default(0),
  })
  .strict();
export type CreateWalletInput = z.infer<typeof createWalletSchema>;

export const updateWalletSchema = z
  .object({ name: nameSchema, type: walletTypeSchema })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;

export const transferSchema = z
  .object({
    fromWalletId: idSchema,
    toWalletId: idSchema,
    amount: positiveRupiahSchema,
    date: dateOnlySchema,
    note: noteSchema.optional(),
  })
  .strict();
export type TransferInput = z.infer<typeof transferSchema>;

export const walletSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: walletTypeSchema,
  balance: z.number().int(),
  isArchived: z.boolean(),
  sortOrder: z.number().int(),
  transactionCountThisMonth: z.number().int(),
});
export type WalletDto = z.infer<typeof walletSchema>;

export interface WalletListDto {
  data: WalletDto[];
  total: number;
}

export interface TransferResultDto {
  transactionId: string;
  from: WalletDto;
  to: WalletDto;
}
