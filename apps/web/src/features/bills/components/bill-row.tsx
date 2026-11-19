import { formatRupiah, todayInJakarta, type BillDto } from '@coinbook/shared';
import { LunasStamp } from '@/components/coinbook/lunas-stamp';
import { Button } from '@/components/ui/button';
import { formatDayMonth } from '@/lib/format-date';
import { BillStatusBadge } from './bill-status-badge';

const CYCLE_LABELS = { MONTHLY: 'Bulanan', YEARLY: 'Tahunan' } as const;
const BUTTON_WIDTH = 'w-full @min-[560px]/cb:w-auto @min-[1024px]/cb:w-full';

function billMeta(bill: BillDto): string {
  const parts = [CYCLE_LABELS[bill.cycle], bill.wallet.name];
  if (bill.status === 'PAID' && bill.lastPaidAt) {
    parts.push(`dibayar ${formatDayMonth(todayInJakarta(new Date(bill.lastPaidAt)))}`);
  }
  return parts.join(' · ');
}

export interface BillRowProps {
  bill: BillDto;
  justPaid: boolean;
  paying: boolean;
  onPay: (bill: BillDto) => void;
  onHistory: (bill: BillDto) => void;
  onEdit: (bill: BillDto) => void;
}

export function BillRow({ bill, justPaid, paying, onPay, onHistory, onEdit }: BillRowProps) {
  const paid = bill.status === 'PAID';
  return (
    <li className="bill">
      <div className="n">
        <button
          type="button"
          aria-haspopup="dialog"
          className="block cursor-pointer text-left font-medium hover:underline"
          onClick={() => onEdit(bill)}
        >
          {bill.name}
        </button>
        <div className="text-meta text-muted">{billMeta(bill)}</div>
      </div>
      <div className="d">
        <span className="sr">Jatuh tempo </span>
        {formatDayMonth(bill.nextDueDate)}
      </div>
      <div className="a">{formatRupiah(bill.amount)}</div>
      <div className="s">
        <BillStatusBadge bill={bill} />
      </div>
      <div className="b">
        {paid ? (
          <Button variant="quiet" className={BUTTON_WIDTH} onClick={() => onHistory(bill)}>
            Riwayat bayar
          </Button>
        ) : (
          <Button className={BUTTON_WIDTH} onClick={() => onPay(bill)} disabled={paying}>
            Tandai lunas
          </Button>
        )}
      </div>
      {paid ? <LunasStamp size="sm" animate={justPaid} /> : null}
    </li>
  );
}
