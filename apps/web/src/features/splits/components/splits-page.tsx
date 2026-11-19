'use client';

import { formatRupiah, type SplitSummaryDto } from '@coinbook/shared';
import { Plus, Receipt } from 'lucide-react';
import Link from 'next/link';
import { Badge, Panel } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { formatDayMonth } from '@/lib/format-date';
import { useSplits } from '../hooks/use-splits';
import { DebtStatusBadge } from './debt-status-badge';

const ROW = 'flex min-h-11 items-center justify-between gap-3';

function SplitRow({ split }: { split: SplitSummaryDto }) {
  return (
    <li>
      <Link className="srow" href={`/splits/${split.id}`}>
        <span className="ico" aria-hidden="true">
          <Receipt size={20} />
        </span>
        <span className="st">{split.title}</span>
        <span className="sa">{formatRupiah(split.grandTotal)}</span>
        <span className="sm">
          {formatDayMonth(split.date)} ·{' '}
          <span className="segs" aria-hidden="true">
            {Array.from({ length: split.peopleCount }, (_, i) => (
              <span key={i} className={i < split.paidCount ? 'f' : undefined} />
            ))}
          </span>
          {split.paidCount} dari {split.peopleCount} sudah lunas
        </span>
        <span className="ss">
          {split.status === 'PAID' ? (
            <Badge variant="paid">Lunas</Badge>
          ) : (
            <Badge variant="unpaid">Belum lunas</Badge>
          )}
        </span>
      </Link>
    </li>
  );
}

function shortTitle(title: string): string {
  return title.replace(/^Patungan\s+/i, '');
}

export function SplitsPage() {
  const splits = useSplits();
  const data = splits.data;
  return (
    <>
      <header className="ph">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">Patungan</h1>
          {data ? (
            <p className="text-body">
              Teman masih berutang{' '}
              <span className="font-medium">{formatRupiah(data.receivablesTotal)}</span> ke kamu
            </p>
          ) : null}
        </div>
        <Link className={buttonClasses()} href="/splits/new">
          <Plus size={20} aria-hidden="true" />
          Buat patungan
        </Link>
      </header>
      {data ? (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @min-[1024px]/cb:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel as="section" padded={false} className="px-5 py-1" aria-label="Daftar patungan">
            <ul>
              {data.data.map((s) => (
                <SplitRow key={s.id} split={s} />
              ))}
            </ul>
          </Panel>
          <Panel as="aside" padded={false} className="px-5" aria-labelledby="s-piu">
            <section className="py-5">
              <h2 className="text-h2 leading-[1.2] font-medium" id="s-piu">
                Piutang per orang
              </h2>
              {data.receivables.length === 0 ? (
                <p className="pt-1 pb-2 text-meta text-muted">
                  Belum ada piutang. Buat patungan saat makan bareng teman.
                </p>
              ) : (
                <ul className="mt-2">
                  {data.receivables.map((r) => (
                    <li
                      key={r.personId}
                      className={`${ROW} flex-wrap border-t border-dashed border-rule py-2`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="av sm" aria-hidden="true">
                          {r.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex flex-col">
                          <span className="font-medium">{r.name}</span>
                          <span className="text-meta text-muted">{shortTitle(r.splitTitle)}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2.5">
                        <DebtStatusBadge status={r.status} />
                        <span className="font-medium">{formatRupiah(r.amount)}</span>
                      </span>
                    </li>
                  ))}
                  <li className={`${ROW} border-t border-rule pt-2`}>
                    <span className="font-medium">Total</span>
                    <span className="font-medium">{formatRupiah(data.receivablesTotal)}</span>
                  </li>
                </ul>
              )}
            </section>
          </Panel>
        </div>
      ) : (
        <Panel className="h-64" aria-busy="true" />
      )}
    </>
  );
}
