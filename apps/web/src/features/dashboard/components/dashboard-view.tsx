import {
  formatRupiah,
  todayInJakarta,
  type BillDto,
  type DashboardReportDto,
  type ReceivableDto,
  type TransactionDto,
  type WalletListDto,
} from '@coinbook/shared';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Passbook } from '@/components/coinbook/passbook';
import { MobileTopBar, type ShellUser } from '@/components/shell/app-shell';
import { Panel } from '@/components/ui/badge';
import { buttonClasses, linkClasses } from '@/components/ui/button';
import { BillStatusBadge } from '@/features/bills/components/bill-status-badge';
import { DebtStatusBadge } from '@/features/splits/components/debt-status-badge';
import { toPassbookMonths } from '@/features/transactions/to-passbook';
import { cn } from '@/lib/cn';
import { formatDayMonth, formatLongDate, formatMonthYear } from '@/lib/format-date';

const ROW = 'flex min-h-11 items-center justify-between gap-3';
const DASHED = 'border-t border-dashed border-rule';

interface SectionProps {
  id: string;
  title: string;
  aside: ReactNode;
  children: ReactNode;
}

function Section({ id, title, aside, children }: SectionProps) {
  return (
    <section className="border-t border-rule py-5 first:border-t-0" aria-labelledby={id}>
      <div className={ROW}>
        <h2 className="text-h2 leading-[1.2] font-medium" id={id}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="pt-1 pb-2 text-meta text-muted">{children}</p>;
}

function MonthSection({ report }: { report: DashboardReportDto }) {
  const { income, expense, net } = report.summary;
  return (
    <Section
      id="d-bulan"
      title="Bulan ini"
      aside={<span className="text-meta text-muted">{formatMonthYear(report.month)}</span>}
    >
      <div className={ROW}>
        <span>Pemasukan</span>
        <span className="font-medium text-income">{formatRupiah(income, { sign: true })}</span>
      </div>
      <div className={ROW}>
        <span>Pengeluaran</span>
        <span className="font-medium text-expense">{formatRupiah(-expense)}</span>
      </div>
      <div className={cn(ROW, DASHED)}>
        <span className="text-muted">Selisih</span>
        <span className="font-medium">{formatRupiah(net, { sign: net !== 0 })}</span>
      </div>
    </Section>
  );
}

function BillsSection({ bills }: { bills: BillDto[] }) {
  return (
    <Section
      id="d-tag"
      title="Tagihan terdekat"
      aside={
        <Link className={linkClasses} href="/bills">
          Semua tagihan
        </Link>
      }
    >
      {bills.length === 0 ? (
        <EmptyNote>
          Belum ada tagihan. Tambahkan langganan supaya diingatkan sebelum jatuh tempo.
        </EmptyNote>
      ) : (
        <ul>
          {bills.map((bill) => (
            <li
              key={bill.id}
              className={cn(
                'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-3',
                DASHED,
              )}
            >
              <span className="font-medium">{bill.name}</span>
              <span className="font-medium">{formatRupiah(bill.amount)}</span>
              <span className="text-meta text-muted">{formatDayMonth(bill.nextDueDate)}</span>
              <BillStatusBadge bill={bill} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ReceivablesSection({ total, people }: { total: number; people: ReceivableDto[] }) {
  return (
    <Section
      id="d-piu"
      title="Piutang"
      aside={
        <Link className={linkClasses} href="/splits">
          Lihat patungan
        </Link>
      }
    >
      {people.length === 0 ? (
        <EmptyNote>Belum ada piutang. Buat patungan saat makan bareng teman.</EmptyNote>
      ) : (
        <>
          <p className="text-meta text-muted">Teman masih berutang</p>
          <p className="mt-0.5 mb-2 text-2xl leading-[1.2] font-medium">{formatRupiah(total)}</p>
          <ul>
            {people.map((p) => (
              <li key={p.personId} className={cn(ROW, DASHED, 'flex-wrap py-2 @min-[375px]/cb:flex-nowrap')}>
                <span className="flex items-center gap-2.5">
                  <span className="av sm" aria-hidden="true">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  {p.name}
                </span>
                <span className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
                  <DebtStatusBadge status={p.status} />
                  <span className="font-medium">{formatRupiah(p.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

function walletSubline(wallets: WalletListDto): string | undefined {
  const active = wallets.data.filter((w) => !w.isArchived);
  if (active.length === 0) return undefined;
  return active.map((w) => `${w.name} ${formatRupiah(w.balance, { prefix: false })}`).join(' · ');
}

function PassbookFooter({ count }: { count: number }) {
  return (
    <>
      <span className="text-meta text-muted">{count} transaksi terakhir</span>
      <Link className={linkClasses} href="/transactions">
        Lihat semua
      </Link>
    </>
  );
}

function PassbookEmpty() {
  return (
    <>
      <p className="max-w-[70ch] text-body">
        Belum ada catatan bulan ini. Catat pengeluaran pertamamu.
      </p>
      <Link className={buttonClasses()} href="/transactions">
        <Plus size={20} aria-hidden="true" />
        Catat pengeluaran
      </Link>
    </>
  );
}

export interface DashboardViewProps {
  user: ShellUser;
  firstName: string;
  report: DashboardReportDto;
  wallets: WalletListDto;
  recent: TransactionDto[];
}

export function DashboardView({ user, firstName, report, wallets, recent }: DashboardViewProps) {
  const hasRows = recent.length > 0;
  const months = hasRows
    ? toPassbookMonths(recent)
    : [{ label: formatMonthYear(report.month), rows: [] }];
  return (
    <>
      <MobileTopBar user={user} />
      <header className="ph">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">
            Halo, {firstName}
          </h1>
          <p className="text-meta text-muted-desk">{formatLongDate(todayInJakarta())}</p>
        </div>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @min-[1024px]/cb:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-label="Buku tabungan">
          <Passbook
            balance={formatRupiah(wallets.total)}
            subline={hasRows ? walletSubline(wallets) : undefined}
            months={months}
            footer={hasRows ? <PassbookFooter count={recent.length} /> : undefined}
            empty={<PassbookEmpty />}
          />
        </section>
        <Panel as="aside" padded={false} className="px-5" aria-label="Ringkasan">
          <MonthSection report={report} />
          <BillsSection bills={report.upcomingBills} />
          <ReceivablesSection total={report.receivables.total} people={report.receivables.people} />
        </Panel>
      </div>
    </>
  );
}
