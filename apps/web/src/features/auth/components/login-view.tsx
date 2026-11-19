'use client';

import { Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { CoinMark } from '@/components/coinbook/coin-mark';
import { Button, linkClasses } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/browser';
import { useStartDemo } from '../hooks/use-auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_ERROR = 'Email belum benar. Contoh: nama@email.com';
const LINK_ERROR = 'Link masuk tidak berlaku lagi. Kirim link baru.';

const callbackUrl = () => `${env.NEXT_PUBLIC_APP_URL}/auth/callback`;

export function LoginView() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const demo = useStartDemo();
  const linkExpired = params.get('error') === 'auth';
  const error = invalid ? EMAIL_ERROR : linkExpired ? LINK_ERROR : undefined;

  const google = async () => {
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (oauthError) toast.show(DEFAULT_ERROR_MESSAGE, 'error');
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setInvalid(true);
      return;
    }
    setSending(true);
    const { error: otpError } = await createClient().auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: callbackUrl() },
    });
    setSending(false);
    if (otpError) toast.show(DEFAULT_ERROR_MESSAGE, 'error');
    else setSentTo(value);
  };

  return (
    <div className="flex min-h-[760px] flex-col items-center justify-center px-4 py-10">
      <main className="flex w-full max-w-[400px] flex-col gap-5 rounded-paper bg-paper px-6 py-8 shadow-paper">
        <div className="flex flex-col items-center gap-3 text-center">
          <CoinMark size="lg" />
          <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">
            Masuk ke Coinbook
          </h1>
          <p className="text-meta text-muted">Catatan uangmu tersimpan aman di akunmu.</p>
        </div>
        <Button variant="secondary" full onClick={() => void google()}>
          Lanjut dengan Google
        </Button>
        <div className="flex items-center gap-3 text-meta text-muted">
          <span className="flex-1 border-t border-rule" />
          atau pakai email
          <span className="flex-1 border-t border-rule" />
        </div>
        {sentTo ? (
          <div role="status" className="flex items-start gap-3 rounded-control bg-desk p-3.5">
            <Mail size={20} aria-hidden="true" className="mt-0.5 flex-none text-ink-700" />
            <p className="text-body">
              Link masuk sudah dikirim ke <span className="font-medium">{sentTo}</span>. Buka
              emailmu dan ketuk linknya.
            </p>
          </div>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={(e) => void send(e)} noValidate>
            <Field label="Email" htmlFor="l-mail" error={error} errorId="l-err">
              <Input
                id="l-mail"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                icon={<Mail size={18} />}
                value={email}
                aria-invalid={invalid}
                aria-describedby={error ? 'l-err' : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInvalid(false);
                }}
              />
            </Field>
            <Button type="submit" full disabled={sending}>
              Kirim link masuk
            </Button>
          </form>
        )}
        <p className="text-center text-meta text-muted">
          Belum mau daftar?{' '}
          <button
            type="button"
            className={cn(
              linkClasses,
              'min-h-0 cursor-pointer disabled:cursor-wait disabled:opacity-60',
            )}
            onClick={() =>
              demo.mutate(undefined, { onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error') })
            }
            disabled={demo.isPending}
          >
            Lihat demo
          </button>
        </p>
      </main>
    </div>
  );
}
