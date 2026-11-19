import { Panel } from '@/components/ui/badge';

const ROWS = [0, 1, 2, 3, 4];

export function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <div className="ph">
        <div className="flex flex-col gap-2">
          <span className="block h-8 w-44 rounded-md bg-rule" />
          <span className="block h-4 w-40 rounded bg-rule" />
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @min-[1024px]/cb:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel padded={false} className="overflow-hidden">
          <div className="h-32 bg-[var(--cover)]" />
          <div className="flex flex-col gap-4 p-5">
            {ROWS.map((i) => (
              <span key={i} className="block h-5 rounded bg-rule" />
            ))}
          </div>
        </Panel>
        <Panel className="flex flex-col gap-4">
          {ROWS.map((i) => (
            <span key={i} className="block h-5 rounded bg-rule" />
          ))}
        </Panel>
      </div>
    </div>
  );
}
