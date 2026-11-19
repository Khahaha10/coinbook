'use client';

import { notFound } from 'next/navigation';
import { AppShell, MobileTopBar } from '@/components/shell/app-shell';
import { ToastProvider, useToast } from '@/components/ui/toast';

const USER = { name: 'Rani Putri', initials: 'RP' };

function Preview() {
  const toast = useToast();
  return (
    <AppShell
      user={USER}
      activePath="/dashboard"
      onAddTransaction={() => toast.show('Catat transaksi')}
    >
      <MobileTopBar user={USER} />
      <header className="mb-5 flex flex-col gap-1">
        <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">Halo, Rani</h1>
        <p className="text-meta text-muted-desk">Rabu, 18 November 2026</p>
      </header>
    </AppShell>
  );
}

export default function DevShellPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <ToastProvider>
      <Preview />
    </ToastProvider>
  );
}
