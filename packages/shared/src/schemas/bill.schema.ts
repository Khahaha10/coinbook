import { z } from 'zod';
import type { BillCycle } from '../types/enums';
import type { BillStatus } from '../utils/bill-cycle';
import type { DateOnly } from '../utils/dates';
import {
  billCycleSchema,
  dateOnlySchema,
  idSchema,
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
