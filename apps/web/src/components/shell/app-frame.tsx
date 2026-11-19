'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  AddTransactionProvider,
  useAddTransaction,
} from '@/features/transactions/components/add-transaction';
import { useMe } from '@/features/me/hooks/use-me';
import { AppShell } from './app-shell';
import { toShellUser } from './shell-user';

function Frame({ children }: { children: ReactNode }) {
  const me = useMe();
  const addTransaction = useAddTransaction();
  const pathname = usePathname();
  return (
    <AppShell
      user={toShellUser(me.data?.name ?? '')}
      onAddTransaction={addTransaction.open}
      hideBottomNav={pathname === '/splits/new'}
    >
      {children}
    </AppShell>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <AddTransactionProvider>
      <Frame>{children}</Frame>
    </AddTransactionProvider>
  );
}
