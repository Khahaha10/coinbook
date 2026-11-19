import {
  fromDateOnly,
  monthOf,
  monthRange,
  shiftMonth,
  todayInJakarta,
  TRANSACTION_TYPES,
  type TransactionType,
} from '@coinbook/shared';
import type { LedgerFilters } from '@/lib/api/query-keys';
import { formatMonthYear } from '@/lib/format-date';

export const RANGES = ['all', 'month', 'prev', '3m'] as const;
export type Range = (typeof RANGES)[number];

export interface FilterState {
  range: Range;
  walletId: string;
  categoryId: string;
  type: TransactionType | '';
  q: string;
}

export const TYPE_OPTIONS: readonly { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'Pengeluaran' },
  { value: 'INCOME', label: 'Pemasukan' },
  { value: 'TRANSFER', label: 'Transfer' },
];

const shortMonth = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' });

export function currentMonth(): string {
  return monthOf(todayInJakarta());
}

export function rangeOptions(): { value: Exclude<Range, 'all'>; label: string }[] {
  const month = currentMonth();
  const { from, to } = monthRange(month);
  const short = shortMonth.format(fromDateOnly(from));
  return [
    { value: 'month', label: `1–${Number(to.slice(8))} ${short} ${month.slice(0, 4)}` },
    { value: 'prev', label: formatMonthYear(shiftMonth(month, -1)) },
    { value: '3m', label: '3 bulan terakhir' },
  ];
}

export function rangeTitle(range: Range): string {
  const month = currentMonth();
  if (range === 'prev') return formatMonthYear(shiftMonth(month, -1));
  if (range === '3m') return '3 bulan terakhir';
  return formatMonthYear(month);
}

function rangeDates(range: Range): { from?: string; to?: string } {
  const month = currentMonth();
  if (range === 'all') return {};
  if (range === 'prev') return monthRange(shiftMonth(month, -1));
  if (range === '3m') return { from: monthRange(shiftMonth(month, -2)).from, to: monthRange(month).to };
  return monthRange(month);
}

export function parseFilters(params: URLSearchParams): FilterState {
  const range = params.get('range');
  const type = params.get('type');
  return {
    range: RANGES.find((r) => r === range) ?? 'all',
    walletId: params.get('wallet') ?? '',
    categoryId: params.get('category') ?? '',
    type: TRANSACTION_TYPES.find((t) => t === type) ?? '',
    q: params.get('q') ?? '',
  };
}

export function toSearch(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.range !== 'all') params.set('range', state.range);
  if (state.walletId) params.set('wallet', state.walletId);
  if (state.categoryId) params.set('category', state.categoryId);
  if (state.type) params.set('type', state.type);
  if (state.q.trim()) params.set('q', state.q.trim());
  const search = params.toString();
  return search ? `?${search}` : '';
}

export function toLedgerFilters(state: FilterState): LedgerFilters {
  return {
    ...rangeDates(state.range),
    walletId: state.walletId || undefined,
    categoryId: state.categoryId || undefined,
    type: state.type || undefined,
    q: state.q.trim() || undefined,
  };
}
