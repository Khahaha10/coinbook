'use client';

import { formatRupiah } from '@coinbook/shared';
import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Passbook } from '@/components/coinbook/passbook';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useSummaryReport } from '@/features/reports/hooks/use-summary-report';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import {
  currentMonth,
  parseFilters,
  rangeTitle,
  toLedgerFilters,
  toSearch,
  type FilterState,
} from '../filters';
import { useLedger } from '../hooks/use-ledger';
import { toPassbookMonths } from '../to-passbook';
import { useAddTransaction } from './add-transaction';
import { EditTransaction } from './edit-transaction';
import { LedgerFilters } from './ledger-filters';
import { SummaryPanel } from './summary-panel';

const SEARCH_DEBOUNCE_MS = 300;

function PassbookEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <>
      <p className="max-w-[70ch] text-body">
        Belum ada catatan bulan ini. Catat pengeluaran pertamamu.
      </p>
      <Button onClick={onAdd}>
        <Plus size={20} aria-hidden="true" />
        Catat pengeluaran
      </Button>
    </>
  );
}

export function TransactionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const [query, setQuery] = useState(state.q);
  const addTransaction = useAddTransaction();
  const [editingId, setEditingId] = useState<string | null>(null);

  const wallets = useWallets();
  const categories = useCategories();
  const summary = useSummaryReport(currentMonth());
  const ledger = useLedger(toLedgerFilters(state));

  const update = (patch: Partial<FilterState>) =>
    router.replace(`${pathname}${toSearch({ ...state, ...patch })}`, { scroll: false });

  useEffect(() => {
    if (query === state.q) return;
    const timer = setTimeout(() => update({ q: query }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });

  const pages = ledger.data?.pages ?? [];
  const rows = pages.flatMap((p) => p.data);
  const totalPages = pages.at(-1)?.totalPages ?? 0;
  const months = toPassbookMonths(rows, addTransaction.lastCreatedId);
  const walletName = wallets.data?.data.find((w) => w.id === state.walletId)?.name;
  const isUnfiltered =
    state.range === 'all' && !state.walletId && !state.categoryId && !state.type && !state.q;

  return (
    <>
      <header className="ph">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">Transaksi</h1>
          <p className="text-meta text-muted-desk">
            {rangeTitle(state.range)} · {walletName ?? 'semua dompet'}
          </p>
        </div>
        <Button className="hidden @min-[768px]/cb:inline-flex" onClick={addTransaction.open}>
          <Plus size={20} aria-hidden="true" />
          Catat transaksi
        </Button>
      </header>

      <LedgerFilters
        state={state}
        query={query}
        wallets={wallets.data?.data ?? []}
        categories={categories.data ?? []}
        onChange={update}
        onQueryChange={setQuery}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @min-[1440px]/cb:grid-cols-[minmax(0,760px)_minmax(0,1fr)]">
        <Passbook
          balance={wallets.data ? formatRupiah(wallets.data.total) : ''}
          months={months}
          onRowSelect={setEditingId}
          bodyClassName={ledger.isPending ? 'min-h-80' : undefined}
          empty={
            !ledger.isPending && isUnfiltered ? (
              <PassbookEmpty onAdd={addTransaction.open} />
            ) : undefined
          }
          footer={
            rows.length > 0 ? (
              <>
                <span className="text-meta text-muted">
                  Halaman {pages.length} dari {totalPages}
                </span>
                {ledger.hasNextPage ? (
                  <Button
                    variant="quiet"
                    onClick={() => void ledger.fetchNextPage()}
                    disabled={ledger.isFetchingNextPage}
                  >
                    Muat lebih banyak
                  </Button>
                ) : null}
              </>
            ) : undefined
          }
        />
        {summary.data ? <SummaryPanel summary={summary.data} /> : null}
      </div>
      <EditTransaction
        transaction={rows.find((r) => r.id === editingId) ?? null}
        onClose={() => setEditingId(null)}
      />
    </>
  );
}
