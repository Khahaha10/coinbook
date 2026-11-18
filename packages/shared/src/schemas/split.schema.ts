import { z } from 'zod';
import type { DebtStatus, DiscountType } from '../types/enums';
import type { DateOnly } from '../utils/dates';
import type { SplitLine } from '../utils/split-calculator';
import {
  bpsSchema,
  dateOnlySchema,
  discountTypeSchema,
  idSchema,
  nameSchema,
  rupiahSchema,
} from './common';

export const MAX_SPLIT_PEOPLE = 30;
export const MAX_SPLIT_ITEMS = 100;

const personNameSchema = z.string().trim().min(1).max(40);

export const createSplitSchema = z
  .object({
    title: nameSchema,
    date: dateOnlySchema,
    walletId: idSchema,
    taxBps: bpsSchema.default(0),
    serviceBps: bpsSchema.default(0),
    discountType: discountTypeSchema.default('NOMINAL'),
    discountValue: rupiahSchema.default(0),
    people: z
      .array(
        z.object({
          key: z.string().trim().min(1).max(40),
          name: personNameSchema,
          isOwner: z.boolean(),
        }),
      )
      .min(2)
      .max(MAX_SPLIT_PEOPLE),
    items: z
      .array(
        z.object({
          name: nameSchema,
          price: rupiahSchema,
          qty: z.number().int().min(1).max(999),
          personKeys: z.array(z.string()).max(MAX_SPLIT_PEOPLE),
        }),
      )
      .min(1)
      .max(MAX_SPLIT_ITEMS),
  })
  .superRefine((v, ctx) => {
    if (v.people.filter((p) => p.isOwner).length !== 1) {
      ctx.addIssue({ code: 'custom', path: ['people'], message: 'Exactly one owner required' });
    }
    const names = v.people.map((p) => p.name.toLocaleLowerCase('id'));
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: 'custom', path: ['people'], message: 'Names must be unique' });
    }
    const keys = v.people.map((p) => p.key);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: 'custom', path: ['people'], message: 'Keys must be unique' });
    }
    if (v.discountType === 'PERCENT' && v.discountValue > 10_000) {
      ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Max 100%' });
    }
  });
export type CreateSplitInput = z.infer<typeof createSplitSchema>;

export interface SplitDebtDto {
  status: DebtStatus;
  markedPaidAt: string | null;
  confirmedAt: string | null;
  wallet: { id: string; name: string } | null;
}

export interface SplitPersonDto {
  id: string;
  name: string;
  isOwner: boolean;
  share: number;
  subtotal: number;
  extras: number;
  lines: SplitLine[];
  debt: SplitDebtDto | null;
}

export interface SplitItemDto {
  id: string;
  name: string;
  price: number;
  qty: number;
  personIds: string[];
}

export type SplitStatus = 'PAID' | 'UNPAID';

export interface SplitDetailDto {
  id: string;
  title: string;
  date: DateOnly;
  wallet: { id: string; name: string };
  taxBps: number;
  serviceBps: number;
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  discountAmount: number;
  grandTotal: number;
  shareToken: string;
  shareUrl: string;
  items: SplitItemDto[];
  people: SplitPersonDto[];
  paidCount: number;
  peopleCount: number;
  status: SplitStatus;
  receivedTotal: number;
  outstandingTotal: number;
}

export interface SplitSummaryDto {
  id: string;
  title: string;
  date: DateOnly;
  grandTotal: number;
  paidCount: number;
  peopleCount: number;
  status: SplitStatus;
}

export interface ReceivableDto {
  personId: string;
  splitId: string;
  splitTitle: string;
  name: string;
  amount: number;
  status: DebtStatus;
}

export interface SplitListDto {
  data: SplitSummaryDto[];
  receivables: ReceivableDto[];
  receivablesTotal: number;
}
