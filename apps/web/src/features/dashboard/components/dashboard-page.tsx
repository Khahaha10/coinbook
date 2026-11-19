'use client';

import { useMe } from '@/features/me/hooks/use-me';
import { useDashboardReport } from '@/features/reports/hooks/use-dashboard-report';
import { useRecentTransactions } from '@/features/transactions/hooks/use-recent-transactions';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import { toShellUser } from '@/components/shell/shell-user';
import { DashboardSkeleton } from './dashboard-skeleton';
import { DashboardView } from './dashboard-view';

export function DashboardPage() {
  const me = useMe();
  const report = useDashboardReport();
  const wallets = useWallets();
  const recent = useRecentTransactions();

  if (!me.data || !report.data || !wallets.data || !recent.data) return <DashboardSkeleton />;
  return (
    <DashboardView
      user={toShellUser(me.data.name)}
      firstName={me.data.name.split(/\s+/)[0] ?? me.data.name}
      report={report.data}
      wallets={wallets.data}
      recent={recent.data}
    />
  );
}
