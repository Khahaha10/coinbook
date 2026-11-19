'use client';

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
  return (
    <AppShell user={toShellUser(me.data?.name ?? '')} onAddTransaction={addTransaction.open}>
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
