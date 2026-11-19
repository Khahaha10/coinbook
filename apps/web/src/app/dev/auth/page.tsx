'use client';

import { notFound, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { useSignOut, useStartDemo } from '@/features/auth/hooks/use-auth';

export default function DevAuthPage() {
  const startDemo = useStartDemo();
  const signOut = useSignOut();
  const router = useRouter();
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className="flex gap-3 p-8">
      <Button onClick={() => startDemo.mutate()} disabled={startDemo.isPending}>
        Lihat demo
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          void createClient()
            .auth.signInAnonymously()
            .then(() => router.push('/dashboard'))
        }
      >
        Akun kosong
      </Button>
      <Button variant="secondary" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
        Keluar
      </Button>
      {startDemo.isError ? <p role="alert">{startDemo.error.message}</p> : null}
    </main>
  );
}
