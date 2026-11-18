export const BUSINESS_TIMEZONE = 'Asia/Jakarta';
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export type DateOnly = string;
export type MonthKey = string;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;
export function isDateOnly(s: string): s is DateOnly {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return date.toISOString().slice(0, 10) === s;
}
export function isMonthKey(s: string): s is MonthKey {
  const m = MONTH_RE.exec(s);
  return m !== null && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}
export function fromDateOnly(s: DateOnly): Date {
  if (!isDateOnly(s)) throw new RangeError(`Invalid date: ${s}`);
  return new Date(`${s}T00:00:00.000Z`);
}
export function toDateOnly(d: Date): DateOnly {
  return d.toISOString().slice(0, 10);
}
export function todayInJakarta(now: Date = new Date()): DateOnly {
  return new Date(now.getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);
}
export function addDays(s: DateOnly, days: number): DateOnly {
  return toDateOnly(new Date(fromDateOnly(s).getTime() + days * DAY_MS));
}
export function diffDays(a: DateOnly, b: DateOnly): number {
  return Math.round((fromDateOnly(b).getTime() - fromDateOnly(a).getTime()) / DAY_MS);
}
export function monthOf(s: DateOnly): MonthKey {
  return s.slice(0, 7);
}
export function daysInMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}
export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  if (!isMonthKey(month)) throw new RangeError(`Invalid month: ${month}`);
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}
export function monthRange(month: MonthKey): {
  from: DateOnly;
  to: DateOnly;
} {
  if (!isMonthKey(month)) throw new RangeError(`Invalid month: ${month}`);
  const [y, m] = month.split('-').map(Number) as [number, number];
  return { from: `${month}-01`, to: `${month}-${String(daysInMonth(y, m)).padStart(2, '0')}` };
}
