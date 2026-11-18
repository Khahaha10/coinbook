import { z } from 'zod';
import type { DebtStatus, DiscountType } from '../types/enums';
import type { DateOnly } from '../utils/dates';
import type { SplitLine } from '../utils/split-calculator';
import { idSchema } from './common';

export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/);

export const publicSplitParamsSchema = z.object({ token: shareTokenSchema });
export const publicPersonParamsSchema = z.object({ token: shareTokenSchema, personId: idSchema });

export interface PublicSplitPersonDto {
  id: string;
  name: string;
  isOwner: boolean;
  share: number;
  subtotal: number;
  extras: number;
  lines: SplitLine[];
  status: DebtStatus | null;
}

export interface PublicSplitDto {
  title: string;
  date: DateOnly;
  ownerName: string;
  ownerFirstName: string;
  bankInfo: string | null;
  receipt: {
    items: { name: string; qty: number; price: number; total: number }[];
    subtotal: number;
    taxBps: number;
    taxAmount: number;
    serviceBps: number;
    serviceAmount: number;
    discountType: DiscountType;
    discountValue: number;
    discountAmount: number;
    grandTotal: number;
  };
  people: PublicSplitPersonDto[];
}
