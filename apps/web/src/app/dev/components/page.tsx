import { notFound } from 'next/navigation';
import { ToastProvider } from '@/components/ui/toast';
import { PrimitivesBoard } from './primitives-board';
import { SignatureBoard } from './signature-board';

const COLOR_TOKENS = [
  'ink-900',
  'ink-700',
  'ink-100',
  'desk',
  'paper',
  'rule',
  'rule-strong',
  'text',
  'text-muted',
  'text-muted-desk',
  'brass',
  'brass-dark',
  'income',
  'expense',
  'warning-bg',
  'warning-text',
  'overdue-bg',
  'overdue-text',
  'tag-bg',
  'tag-text',
  'on-primary',
  'primary-hover',
] as const;

function TokenBoard({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <section data-theme={theme} className="flex flex-col gap-6 bg-desk p-8 text-text">
      <h2 className="text-h2 font-medium leading-[1.2]">Tokens · {theme}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {COLOR_TOKENS.map((token) => (
          <div key={token} className="flex items-center gap-3 rounded-control bg-paper p-3">
            <span
              className="size-10 shrink-0 rounded-lg shadow-[inset_0_0_0_1px_rgba(30,27,58,0.08)]"
              style={{ background: `var(--${token})` }}
            />
            <span className="text-meta">{token}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-paper bg-paper p-6 shadow-paper">
        <span className="text-bal font-medium leading-[1.2] tracking-[-0.01em]">Rp4.250.000</span>
        <span className="text-h1 font-medium leading-[1.2] tracking-[-0.01em]">Halo, Rani</span>
        <span className="text-h2 font-medium leading-[1.2]">Tagihan terdekat</span>
        <span className="text-body">Satu buku untuk semua urusan uangmu.</span>
        <span className="text-meta text-muted">Rabu, 18 November 2026</span>
        <span className="font-mono text-[13px]">Sate ayam ½ ........ 30.000</span>
        <span className="text-meta">
          <span className="font-medium text-income">+45.500</span> ·{' '}
          <span className="font-medium text-expense">−35.000</span>
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="h-16 w-32 rounded-paper bg-paper shadow-paper" />
        <div className="h-11 w-32 rounded-control border border-rule bg-paper" />
        <div className="h-7 w-24 rounded-full bg-tag-bg" />
        <div className="h-10 w-24 rounded-stamp border-[2.5px] border-ink-700" />
      </div>
    </section>
  );
}

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <ToastProvider>
      <main className="grid min-h-screen grid-cols-1 @min-[1024px]/cb:grid-cols-2">
        <TokenBoard theme="light" />
        <TokenBoard theme="dark" />
        <PrimitivesBoard theme="light" />
        <PrimitivesBoard theme="dark" />
      </main>
      <SignatureBoard theme="light" />
      <SignatureBoard theme="dark" />
    </ToastProvider>
  );
}
