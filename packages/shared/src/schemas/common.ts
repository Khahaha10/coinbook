import { z } from 'zod';
import { ERROR_CODES } from '../errors';
import {
  BILL_CYCLES,
  CATEGORY_TYPES,
  DEBT_STATUSES,
  DISCOUNT_TYPES,
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  WALLET_TYPES,
} from '../types/enums';
import { isDateOnly, isMonthKey } from '../utils/dates';

export const MAX_RUPIAH = 999_999_999_999;
export const MAX_BPS = 100_000;

export const idSchema = z.uuid();
export const dateOnlySchema = z.string().refine(isDateOnly, 'Invalid date, expected YYYY-MM-DD');
export const monthKeySchema = z.string().refine(isMonthKey, 'Invalid month, expected YYYY-MM');
export const rupiahSchema = z.number().int().min(0).max(MAX_RUPIAH);
export const positiveRupiahSchema = rupiahSchema.min(1);
export const bpsSchema = z.number().int().min(0).max(MAX_BPS);
export const nameSchema = z.string().trim().min(1).max(80);
export const noteSchema = z.string().trim().max(200);

export const walletTypeSchema = z.enum(WALLET_TYPES);
export const categoryTypeSchema = z.enum(CATEGORY_TYPES);
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);
export const transactionSourceSchema = z.enum(TRANSACTION_SOURCES);
export const billCycleSchema = z.enum(BILL_CYCLES);
export const debtStatusSchema = z.enum(DEBT_STATUSES);
export const discountTypeSchema = z.enum(DISCOUNT_TYPES);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
