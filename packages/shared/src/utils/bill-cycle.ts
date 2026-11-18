import type { BillCycle } from '../types/enums';
import { daysInMonth, diffDays, fromDateOnly, monthOf, toDateOnly, type DateOnly } from './dates';
export function nextDueDate(current: DateOnly, cycle: BillCycle, anchorDay: number): DateOnly {
  if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) {
    throw new RangeError(`anchorDay must be 1–31, got ${anchorDay}`);
  }
  const d = fromDateOnly(current);
  let year = d.getUTCFullYear();
  let month = d.getUTCMonth() + 1;
  if (cycle === 'MONTHLY') {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  } else {
    year += 1;
  }
  const day = Math.min(anchorDay, daysInMonth(year, month));
  return toDateOnly(new Date(Date.UTC(year, month - 1, day)));
}
export type BillStatus = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'PAID';
export const DUE_SOON_DAYS = 7;
export function billStatus(input: {
  nextDueDate: DateOnly;
  lastPaidDueDate: DateOnly | null;
  today: DateOnly;
}): {
  status: BillStatus;
  daysUntilDue: number;
} {
  const { nextDueDate: next, lastPaidDueDate, today } = input;
  const daysUntilDue = diffDays(today, next);
  const thisMonth = monthOf(today);
  if (lastPaidDueDate && monthOf(lastPaidDueDate) === thisMonth && monthOf(next) > thisMonth) {
    return { status: 'PAID', daysUntilDue };
  }
  if (daysUntilDue < 0) return { status: 'OVERDUE', daysUntilDue };
  if (daysUntilDue <= DUE_SOON_DAYS) return { status: 'DUE_SOON', daysUntilDue };
  return { status: 'UPCOMING', daysUntilDue };
}
export function monthlyEquivalent(amount: number, cycle: BillCycle): number {
  return cycle === 'MONTHLY' ? amount : Math.round(amount / 12);
}
