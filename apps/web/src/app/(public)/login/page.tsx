import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginView } from '@/features/auth/components/login-view';

export const metadata: Metadata = { title: 'Masuk · Coinbook' };

export default function Page() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
