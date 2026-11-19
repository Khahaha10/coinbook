'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMe } from '@/features/me/hooks/use-me';
import { AppShell, type ShellUser } from './app-shell';

function toShellUser(name: string): ShellUser {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return { name, initials };
}

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
