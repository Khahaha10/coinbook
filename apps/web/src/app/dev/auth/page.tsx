'use client';

import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSignOut, useStartDemo } from '@/features/auth/hooks/use-auth';

export default function DevAuthPage() {
  const startDemo = useStartDemo();
  const signOut = useSignOut();
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className="flex gap-3 p-8">
      <Button onClick={() => startDemo.mutate()} disabled={startDemo.isPending}>
        Lihat demo
      </Button>
      <Button variant="secondary" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
        Keluar
      </Button>
      {startDemo.isError ? <p role="alert">{startDemo.error.message}</p> : null}
    </main>
  );
}
