'use client';

import { formatRupiah, todayInJakarta, type BillDto } from '@coinbook/shared';
import { Sheet } from '@/components/ui/sheet';
import { formatDayMonth } from '@/lib/format-date';
import { useBillPayments } from '../hooks/use-bills';

export interface PaymentsSheetProps {
  bill: BillDto | null;
  onClose: () => void;
}

export function PaymentsSheet({ bill, onClose }: PaymentsSheetProps) {
  const payments = useBillPayments(bill?.id ?? null);
  return (
    <Sheet
      open={bill !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      title="Riwayat bayar"
    >
      <p className="text-meta text-muted">{bill?.name}</p>
      <ul className="mt-2">
        {(payments.data ?? []).map((p) => (
          <li
            key={p.id}
            className="flex min-h-11 items-center justify-between gap-3 border-t border-dashed border-rule py-3 first:border-t-0"
          >
            <span className="flex flex-col">
              <span className="font-medium">{formatDayMonth(p.dueDate)}</span>
              <span className="text-meta text-muted">
                {p.wallet.name} · dibayar {formatDayMonth(todayInJakarta(new Date(p.paidAt)))}
              </span>
            </span>
            <span className="font-medium">{formatRupiah(p.amount)}</span>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
