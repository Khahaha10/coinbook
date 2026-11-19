import { formatRupiah, type SummaryReportDto, type WalletType } from '@coinbook/shared';
import { ArrowLeftRight, Banknote, Landmark, Smartphone, type LucideIcon } from 'lucide-react';
import { Panel } from '@/components/ui/badge';

const ROW = 'flex min-h-11 items-center justify-between gap-3';

export const WALLET_ICONS: Record<WalletType, LucideIcon> = {
  BANK: Landmark,
  EWALLET: Smartphone,
  CASH: Banknote,
};

const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone: 'UTC' });

export function SummaryPanel({ summary }: { summary: SummaryReportDto }) {
  const title = `Ringkasan ${monthName.format(new Date(`${summary.month}-01T00:00:00Z`))}`;
  return (
    <Panel as="aside" className="hidden @min-[1440px]/cb:block" aria-labelledby="t-sum">
      <h2 className="text-h2 leading-[1.2] font-medium" id="t-sum">
        {title}
      </h2>
      <div className="mt-2 flex flex-col">
        <div className={ROW}>
          <span>Pemasukan</span>
          <span className="font-medium text-income">
            {formatRupiah(summary.income, { sign: true })}
          </span>
        </div>
        <div className={ROW}>
          <span>Pengeluaran</span>
          <span className="font-medium text-expense">{formatRupiah(-summary.expense)}</span>
        </div>
        <div className={ROW}>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <ArrowLeftRight size={18} aria-hidden="true" />
            Transfer
          </span>
          <span className="font-medium text-muted">{formatRupiah(summary.transfer)}</span>
        </div>
      </div>
      <hr className="my-3 border-0 border-t border-rule" />
      <p className="mb-1 text-meta text-muted">Saldo per dompet</p>
      {summary.wallets.map((w) => {
        const Icon = WALLET_ICONS[w.type];
        return (
          <div key={w.id} className={ROW}>
            <span className="inline-flex items-center gap-2.5">
              <Icon size={18} aria-hidden="true" />
              {w.name}
            </span>
            <span className="font-medium">{formatRupiah(w.balance)}</span>
          </div>
        );
      })}
    </Panel>
  );
}
