import { monthOf, type TransactionDto } from '@coinbook/shared';
import type { PassbookMonth, PassbookRow } from '@/components/coinbook/passbook';
import { formatDdMm, formatMonthYear } from '@/lib/format-date';

const TAGS = { BILL: 'Tagihan', SPLIT: 'Patungan', MANUAL: undefined } as const;
const KINDS = { INCOME: 'income', EXPENSE: 'expense', TRANSFER: 'transfer' } as const;

export function toPassbookRow(tx: TransactionDto, isNew = false): PassbookRow {
  return {
    id: tx.id,
    date: formatDdMm(tx.date),
    description: tx.description,
    tag: TAGS[tx.source],
    kind: KINDS[tx.type],
    amount: tx.amount,
    balanceAfter: tx.balanceAfter ?? 0,
    isNew,
  };
}

export function toPassbookMonths(
  transactions: TransactionDto[],
  newId: string | null = null,
): PassbookMonth[] {
  const months: PassbookMonth[] = [];
  for (const tx of transactions) {
    const label = formatMonthYear(monthOf(tx.date));
    const last = months.at(-1);
    const row = toPassbookRow(tx, tx.id === newId);
    if (last?.label === label) last.rows.push(row);
    else months.push({ label, rows: [row] });
  }
  return months;
}
