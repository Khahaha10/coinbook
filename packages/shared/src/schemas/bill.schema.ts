import { z } from 'zod';
import type { BillCycle } from '../types/enums';
import type { BillStatus } from '../utils/bill-cycle';
import type { DateOnly } from '../utils/dates';
import {
  billCycleSchema,
  dateOnlySchema,
  idSchema,
  monthKeySchema,
  nameSchema,
  positiveRupiahSchema,
} from './common';
import { remindDaysSchema } from './me.schema';

export const createBillSchema = z
  .object({
    name: nameSchema,
    amount: positiveRupiahSchema,
    cycle: billCycleSchema,
    dueDate: dateOnlySchema,
    walletId: idSchema,
    categoryId: idSchema,
    remindDays: remindDaysSchema.optional(),
  })
  .strict();
export type CreateBillInput = z.infer<typeof createBillSchema>;

export const updateBillSchema = z
  .object({
    name: nameSchema,
    amount: positiveRupiahSchema,
    cycle: billCycleSchema,
    dueDate: dateOnlySchema,
    walletId: idSchema,
    categoryId: idSchema,
    remindDays: remindDaysSchema,
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

export interface BillDto {
  id: string;
  name: string;
  amount: number;
  cycle: BillCycle;
  anchorDay: number;
  nextDueDate: DateOnly;
  wallet: { id: string; name: string };
  category: { id: string; name: string; icon: string };
  remindDays: number[];
  isActive: boolean;
  status: BillStatus;
  daysUntilDue: number;
  lastPaidAt: string | null;
  lastPaidDueDate: DateOnly | null;
}

export interface BillListDto {
  data: BillDto[];
  monthlyTotal: number;
  activeCount: number;
}

export const payBillSchema = z.object({ dueDate: dateOnlySchema.optional() }).strict();
export type PayBillInput = z.infer<typeof payBillSchema>;

export const billCalendarQuerySchema = z.object({ month: monthKeySchema }).strict();
export type BillCalendarQuery = z.infer<typeof billCalendarQuerySchema>;

export interface BillPaymentDto {
  id: string;
  dueDate: DateOnly;
  paidAt: string;
  amount: number;
  wallet: { id: string; name: string };
  transactionId: string;
}

export interface BillCalendarMarker {
  date: DateOnly;
  billId: string;
  name: string;
  paid: boolean;
}

export interface BillCalendarDto {
  month: string;
  markers: BillCalendarMarker[];
}
