import { formatRupiah } from '@coinbook/shared';
import { ArrowLeftRight } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { Tag } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { CoinMark } from './coin-mark';

export type PassbookRowKind = 'income' | 'expense' | 'transfer';

export interface PassbookRow {
  id: string;
  date: string;
  description: string;
  tag?: string;
  kind: PassbookRowKind;
  amount: number;
  balanceAfter: number;
  isNew?: boolean;
}

export interface PassbookMonth {
  label: string;
  rows: PassbookRow[];
}

export interface PassbookProps {
  balance: string;
  subline?: string;
  label?: string;
  months: PassbookMonth[];
  showMonthLabels?: boolean;
  footer?: ReactNode;
  empty?: ReactNode;
  className?: string;
  bodyClassName?: string;
  onRowSelect?: (id: string) => void;
}

function Mutation({ kind, amount }: { kind: PassbookRowKind; amount: number }) {
  if (kind === 'transfer') {
    return (
      <span className="m tr">
        <ArrowLeftRight size={16} aria-hidden="true" />
        {formatRupiah(amount, { prefix: false })}
        <span className="sr"> transfer antar dompet</span>
      </span>
    );
  }
  const signed = kind === 'income' ? amount : -amount;
  return (
    <span className={cn('m', kind === 'income' ? 'inc' : 'exp')}>
      {formatRupiah(signed, { prefix: false, sign: true })}
    </span>
  );
}

export function Passbook({
  balance,
  subline,
  label = 'Saldo semua dompet',
  months,
  showMonthLabels = true,
  footer,
  empty,
  className,
  bodyClassName,
  onRowSelect,
}: PassbookProps) {
  const hasRows = months.some((m) => m.rows.length > 0);
  const RowTag = onRowSelect ? 'button' : 'div';
  return (
    <div className={cn('pb', className)}>
      <div className="pb-cover">
        <div>
          <div className="lab">{label}</div>
          <div className="bal">{balance}</div>
          {subline ? <div className="sub">{subline}</div> : null}
        </div>
        <CoinMark />
      </div>
      <div className={cn('pb-body', bodyClassName)}>
        <div className="pb-head" aria-hidden="true">
          <span>Tgl</span>
          <span>Keterangan</span>
          <span>Mutasi</span>
          <span>Saldo</span>
        </div>
        {months.map((month) => (
          <Fragment key={month.label}>
            {showMonthLabels ? <div className="pb-month">{month.label}</div> : null}
            {month.rows.map((row, i) => (
              <RowTag
                key={row.id}
                {...(onRowSelect
                  ? { type: 'button' as const, onClick: () => onRowSelect(row.id), 'aria-haspopup': 'dialog' as const }
                  : {})}
                className={cn(
                  'pb-row',
                  row.isNew && 'new',
                  onRowSelect && 'w-full cursor-pointer bg-transparent text-left hover:bg-desk',
                )}
                style={!showMonthLabels && i === 0 ? { borderTop: 0 } : undefined}
              >
                <span className="d">{row.date}</span>
                <span className="k">
                  {row.description}
                  {row.tag ? <Tag>{row.tag}</Tag> : null}
                </span>
                <Mutation kind={row.kind} amount={row.amount} />
                <span className="s">{formatRupiah(row.balanceAfter, { prefix: false })}</span>
              </RowTag>
            ))}
          </Fragment>
        ))}
        {!hasRows && empty ? <div className="pb-empty">{empty}</div> : null}
      </div>
      {footer ? <div className="pb-foot">{footer}</div> : null}
    </div>
  );
}
