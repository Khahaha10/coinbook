'use client';

import {
  formatRupiah,
  shiftMonth,
  type CategoryReportDto,
  type SummaryReportDto,
  type TrendPointDto,
} from '@coinbook/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Panel } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { currentMonth } from '@/features/transactions/filters';
import { formatMonthYear } from '@/lib/format-date';
import { useCategoryReport, useTrend } from '../hooks/use-reports';
import { useSummaryReport } from '../hooks/use-summary-report';

const OPACITIES = [1, 0.9, 0.8, 0.72, 0.66, 0.6];
const GRID_STEPS = 3;
const MILLION = 1_000_000;
const THOUSAND = 1_000;

const shortMonth = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' });
const longMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone: 'UTC' });
const monthDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

function niceStep(raw: number): number {
  if (raw <= 0) return MILLION;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 5, 10].find((f) => f * pow >= raw) ?? 10;
  return nice * pow;
}

function axisLabel(v: number): string {
  if (v === 0) return '0';
  if (v >= MILLION) return `${(v / MILLION).toLocaleString('id-ID')} jt`;
  return `${(v / THOUSAND).toLocaleString('id-ID')} rb`;
}

function CategoryPanel({ report }: { report: CategoryReportDto }) {
  return (
    <Panel as="section" aria-labelledby="r-cat">
      <div className="mb-3 flex min-h-11 flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 leading-[1.2] font-medium" id="r-cat">
          Pengeluaran per kategori
        </h2>
        <span className="font-medium text-expense">{formatRupiah(-report.total)}</span>
      </div>
      <ul className="bars">
        {report.categories.map((c, i) => (
          <li key={c.categoryId ?? 'none'} className="bar-r">
            <span className="n">
              <CategoryIcon name={c.icon} size={18} aria-hidden="true" className="text-muted" />
              {c.name}
            </span>
            <span className="tr" aria-hidden="true">
              <span
                style={{
                  width: `${c.relativeToMax * 100}%`,
                  opacity: OPACITIES[Math.min(i, OPACITIES.length - 1)],
                }}
              />
            </span>
            <span className="v">
              {formatRupiah(c.amount)}{' '}
              <span className="text-meta text-muted">{c.percentOfTotal}%</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function TrendPanel({
  points,
  summary,
  isCurrent,
}: {
  points: TrendPointDto[];
  summary: SummaryReportDto;
  isCurrent: boolean;
}) {
  const max = Math.max(0, ...points.flatMap((p) => [p.income, p.expense]));
  const step = niceStep(max / GRID_STEPS);
  const top = step * GRID_STEPS;
  const lines = Array.from({ length: GRID_STEPS + 1 }, (_, i) => top - i * step);
  const height = (v: number) => `${(v / top) * 100}%`;
  return (
    <Panel as="section" aria-labelledby="r-trend">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 leading-[1.2] font-medium" id="r-trend">
          Tren 6 bulan
        </h2>
        <div className="legend">
          <span>
            <i className="bg-income" aria-hidden="true" />
            Pemasukan (+)
          </span>
          <span>
            <i className="bg-expense" aria-hidden="true" />
            Pengeluaran (−)
          </span>
        </div>
      </div>
      <div className="tr-wrap" aria-hidden="true">
        <div className="tr-grid">
          {lines.map((v) => (
            <span key={v} data-v={axisLabel(v)} />
          ))}
        </div>
        <div className="tr-cols">
          {points.map((p) => (
            <div key={p.month} className="tr-col">
              <span className="b bi" style={{ height: height(p.income) }} />
              <span className="b be" style={{ height: height(p.expense) }} />
              <span className="lb">{shortMonth.format(monthDate(p.month))}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sr">
        <table>
          <caption>Pemasukan dan pengeluaran 6 bulan terakhir</caption>
          <thead>
            <tr>
              <th scope="col">Bulan</th>
              <th scope="col">Pemasukan</th>
              <th scope="col">Pengeluaran</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month}>
                <th scope="row">{longMonth.format(monthDate(p.month))}</th>
                <td>{formatRupiah(p.income, { sign: true })}</td>
                <td>{formatRupiah(-p.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isCurrent ? (
        <p className="text-meta text-muted">
          {longMonth.format(monthDate(summary.month))} masih berjalan. Pengeluaran sejauh ini{' '}
          {formatRupiah(-summary.expense)} dari pemasukan{' '}
          {formatRupiah(summary.income, { sign: true })}.
        </p>
      ) : null}
    </Panel>
  );
}

export function ReportsPage() {
  const now = currentMonth();
  const [month, setMonth] = useState(now);
  const categories = useCategoryReport(month);
  const summary = useSummaryReport(month);
  const trend = useTrend();
  return (
    <>
      <header className="ph">
        <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">Laporan</h1>
        <div className="flex items-center gap-1" role="group" aria-label="Pilih bulan">
          <Button
            variant="secondary"
            icon
            aria-label="Bulan sebelumnya"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Button>
          <span className="min-w-[140px] text-center font-medium" aria-live="polite">
            {formatMonthYear(month)}
          </span>
          <Button
            variant="secondary"
            icon
            aria-label="Bulan berikutnya"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </Button>
        </div>
      </header>
      <div className="rp-grid">
        {categories.data ? (
          <CategoryPanel report={categories.data} />
        ) : (
          <Panel className="h-64" aria-busy="true" />
        )}
        {trend.data && summary.data ? (
          <TrendPanel points={trend.data} summary={summary.data} isCurrent={month === now} />
        ) : (
          <Panel className="h-64" aria-busy="true" />
        )}
      </div>
    </>
  );
}
