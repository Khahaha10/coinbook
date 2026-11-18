import { z } from 'zod';
import type { WalletType } from '../types/enums';
import type { BillDto } from './bill.schema';
import type { ReceivableDto } from './split.schema';
import { monthKeySchema } from './common';

export const reportMonthQuerySchema = z.object({ month: monthKeySchema.optional() }).strict();
export type ReportMonthQuery = z.infer<typeof reportMonthQuerySchema>;

export const trendQuerySchema = z
  .object({ months: z.coerce.number().int().min(1).max(12).default(6) })
  .strict();
export type TrendQuery = z.infer<typeof trendQuerySchema>;

export const UNCATEGORIZED_NAME = 'Lainnya';
export const UNCATEGORIZED_ICON = 'circle-ellipsis';

export interface MonthTotalsDto {
  income: number;
  expense: number;
  net: number;
}

export interface SummaryReportDto extends MonthTotalsDto {
  month: string;
  transfer: number;
  wallets: { id: string; name: string; type: WalletType; balance: number }[];
}

export interface CategorySpendDto {
  categoryId: string | null;
  name: string;
  icon: string;
  amount: number;
  percentOfTotal: number;
  relativeToMax: number;
}

export interface CategoryReportDto {
  month: string;
  total: number;
  categories: CategorySpendDto[];
}

export interface TrendPointDto {
  month: string;
  income: number;
  expense: number;
}

export interface DashboardReportDto {
  month: string;
  summary: MonthTotalsDto;
  upcomingBills: BillDto[];
  receivables: { total: number; people: ReceivableDto[] };
}
