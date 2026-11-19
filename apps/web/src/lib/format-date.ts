import { fromDateOnly, type DateOnly, type MonthKey } from '@coinbook/shared';

const longDate = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayMonth = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function formatLongDate(date: DateOnly): string {
  return longDate.format(fromDateOnly(date));
}

export function formatDayMonth(date: DateOnly): string {
  return dayMonth.format(fromDateOnly(date));
}

export function formatMonthYear(month: MonthKey): string {
  return monthYear.format(fromDateOnly(`${month}-01` as DateOnly));
}

export function formatDdMm(date: DateOnly): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}
