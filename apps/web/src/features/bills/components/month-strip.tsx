import { daysInMonth, type BillCalendarMarker } from '@coinbook/shared';
import type { CSSProperties } from 'react';
import { CoinMark } from '@/components/coinbook/coin-mark';
import { Panel } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { formatMonthYear } from '@/lib/format-date';

const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone: 'UTC' });

export interface MonthStripProps {
  month: string;
  today: string;
  markers: BillCalendarMarker[];
}

function srText(isToday: boolean, markers: BillCalendarMarker[]): string {
  const parts = markers.map((m) => `${m.name} ${m.paid ? 'sudah lunas' : 'jatuh tempo'}`);
  return [isToday ? 'hari ini' : null, ...parts].filter(Boolean).map((p) => `, ${p}`).join('');
}

export function MonthStrip({ month, today, markers }: MonthStripProps) {
  const [year, mon] = month.split('-').map(Number);
  const count = daysInMonth(year ?? 1970, mon ?? 1);
  const days = Array.from({ length: count }, (_, i) => i + 1);
  const label = monthName.format(new Date(`${month}-01T00:00:00Z`));
  const style = { '--days': count } as CSSProperties;
  return (
    <Panel as="section" aria-labelledby="b-strip">
      <div className="mb-1 flex min-h-11 flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 leading-[1.2] font-medium" id="b-strip">
          {formatMonthYear(month)}
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-meta text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CoinMark size="sm" />
            Jatuh tempo
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CoinMark size="sm" ring />
            Sudah lunas
          </span>
        </div>
      </div>
      <div className="strip" tabIndex={0} aria-label={`Linimasa jatuh tempo ${label}`}>
        <ol className="strip-in" style={style}>
          {days.map((n) => {
            const date = `${month}-${String(n).padStart(2, '0')}`;
            const dayMarkers = markers.filter((m) => m.date === date);
            const due = dayMarkers.length > 0;
            const allPaid = due && dayMarkers.every((m) => m.paid);
            const isToday = date === today;
            return (
              <li key={n} className={cn('day', due && 'due', isToday && 'today')}>
                <span className="mk">
                  {due ? <CoinMark size="sm" ring={allPaid} /> : <span className="tick" aria-hidden="true" />}
                </span>
                <span className="n">{n}</span>
                <span className="sr">{srText(isToday, dayMarkers)}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </Panel>
  );
}
