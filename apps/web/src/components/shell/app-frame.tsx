'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMe } from '@/features/me/hooks/use-me';
import { AppShell } from './app-shell';
import { toShellUser } from './shell-user';

export function AppFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const me = useMe();
  return (
    <AppShell
      user={toShellUser(me.data?.name ?? '')}
      onAddTransaction={() => router.push('/transactions')}
    >
      {children}
    </AppShell>
  );
}
