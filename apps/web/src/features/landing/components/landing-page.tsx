'use client';

import { BookText, CalendarDays, Check, Receipt, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRef, type ReactNode } from 'react';
import { CoinMark, Wordmark } from '@/components/coinbook/coin-mark';
import { buttonClasses, linkClasses } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useStartDemo } from '@/features/auth/hooks/use-auth';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { useLandingMotion } from '../use-landing-motion';
import { Connector } from './connector';
import {
  BillsVisual,
  Decor,
  HeroDesk,
  LedgerVisual,
  SplitVisual,
  type DecorProps,
} from './landing-visuals';

interface FeatureProps {
  id: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  body: string;
  points: [string, string, string];
  visual: ReactNode;
  decor: DecorProps;
  reverse?: boolean;
  padTop?: boolean;
}

function Feature({
  id,
  icon: Icon,
  kicker,
  title,
  body,
  points,
  visual,
  decor,
  reverse,
  padTop,
}: FeatureProps) {
  return (
    <section className={cn('fx', reverse && 'rev')} aria-labelledby={id} data-sc="">
      <Decor {...decor} />
      <div className={cn('fx-vis rvj', padTop && 'pt')} aria-hidden="true">
        {visual}
      </div>
      <div className="rvj d2">
        <span className="fx-kick">
          <Icon size={18} aria-hidden="true" />
          {kicker}
        </span>
        <h2 className="fx-h" id={id}>
          {title}
        </h2>
        <p className="max-w-[70ch] text-body">{body}</p>
        <ul className="fx-list">
          {points.map((p) => (
            <li key={p}>
              <Check size={20} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function GithubIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
    </svg>
  );
}

function CtaButtons({ center }: { center?: boolean }) {
  const demo = useStartDemo();
  const toast = useToast();
  return (
    <div className={cn('flex flex-wrap gap-3', center && 'justify-center')}>
      <button
        type="button"
        className={buttonClasses()}
        disabled={demo.isPending}
        onClick={() =>
          demo.mutate(undefined, { onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error') })
        }
      >
        Lihat demo
      </button>
      <Link className={buttonClasses({ variant: 'secondary' })} href="/login">
        Masuk
      </Link>
    </div>
  );
}

export function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  useLandingMotion(root);
  return (
    <div ref={root} className="overflow-x-hidden">
      <div className="land">
        <header className="l-nav">
          <Link href="/" className="text-text no-underline">
            <Wordmark />
          </Link>
          <Link className={buttonClasses({ variant: 'secondary' })} href="/login">
            Masuk
          </Link>
        </header>
        <main>
          <section className="hero" aria-labelledby="l-h">
            <div className="flex flex-col gap-5">
              <h1 id="l-h" className="max-w-[20ch]">
                Atur uang, tagihan, dan patungan di Coinbook.
              </h1>
              <p className="max-w-[44ch] text-body">
                Dari jajan harian sampai patungan bareng teman.
              </p>
              <CtaButtons />
            </div>
            <HeroDesk />
          </section>

          <Feature
            id="f1"
            icon={BookText}
            kicker="Pencatatan keuangan"
            title="Semua dompet tercatat di satu buku"
            body="Catat pemasukan dan pengeluaran dari rekening bank, e-wallet, dan uang tunai. Setiap baris menampilkan saldo setelah transaksi, seperti buku tabungan."
            points={[
              'Kategori bawaan, plus kategori buatanmu sendiri',
              'Filter per tanggal, dompet, kategori, atau cari catatan',
              'Transfer antar dompet tidak dihitung sebagai pengeluaran',
            ]}
            visual={<LedgerVisual />}
            decor={{
              ring: { '--d': '50px', width: '180px', height: '180px', left: '-60px', top: '8%' },
              coin: { '--d': '90px', left: '46%', top: '2%' },
              coinSize: 18,
              plus: { '--d': '70px', right: '6%', bottom: '6%' },
            }}
          />
          <Connector
            id="k1"
            desktop={{
              path: 'M 720 12 C 720 130, 300 80, 290 196',
              start: [720, 12],
              head: 'M 277 185 L 290 203 L 304 188',
            }}
            mobile={{
              path: 'M 150 8 C 40 40, 260 100, 150 146',
              start: [150, 8],
              head: 'M 138 138 L 150 152 L 163 139',
            }}
          />
          <Feature
            id="f2"
            icon={CalendarDays}
            kicker="Tagihan & langganan"
            title="Tagihan tidak lagi terlewat"
            body="Simpan tagihan bulanan atau tahunan, dari listrik sampai Netflix. Coinbook menghitung total langgananmu per bulan dan mengingatkan sebelum jatuh tempo."
            points={[
              'Pengingat H-3, H-1, dan hari H lewat Telegram atau email',
              'Tandai lunas, pengeluarannya langsung tercatat',
              'Jatuh tempo berikutnya diatur otomatis',
            ]}
            visual={<BillsVisual />}
            reverse
            padTop
            decor={{
              ring: { '--d': '60px', width: '220px', height: '220px', right: '-90px', top: '0' },
              coin: { '--d': '80px', left: '8%', bottom: '4%' },
              coinSize: 22,
              plus: { '--d': '50px', left: '44%', top: '6%' },
            }}
          />
          <Connector
            id="k2"
            desktop={{
              path: 'M 280 12 C 280 130, 700 70, 710 196',
              start: [280, 12],
              head: 'M 696 188 L 710 203 L 722 185',
            }}
            mobile={{
              path: 'M 150 8 C 260 40, 40 100, 150 146',
              start: [150, 8],
              head: 'M 137 139 L 150 152 L 162 138',
            }}
          />
          <Feature
            id="f3"
            icon={Receipt}
            kicker="Patungan"
            title="Bagi tagihan adil sampai rupiah terakhir"
            body="Masukkan item dan pilih siapa yang ikut menanggung. Pajak, service, dan diskon dibagi sesuai pesanan tiap orang, tanpa selisih pembulatan."
            points={[
              'Teman membuka link tanpa perlu akun',
              'Teks siap kirim ke WhatsApp, lengkap dengan nomor rekening',
              'Pembayaran yang dikonfirmasi tercatat sebagai pemasukan',
            ]}
            visual={<SplitVisual />}
            decor={{
              ring: { '--d': '70px', width: '160px', height: '160px', left: '30%', top: '-4%' },
              coin: { '--d': '100px', right: '10%', top: '10%' },
              coinSize: 16,
              plus: { '--d': '60px', left: '2%', bottom: '10%' },
            }}
          />
          <Connector
            id="k3"
            desktop={{
              path: 'M 720 12 C 720 130, 520 90, 500 196',
              start: [720, 12],
              head: 'M 488 184 L 500 203 L 514 187',
            }}
            mobile={{
              path: 'M 150 8 C 40 40, 260 100, 150 146',
              start: [150, 8],
              head: 'M 138 138 L 150 152 L 163 139',
            }}
          />
          <section className="fx-cta rvj" aria-labelledby="cta" data-sc="">
            <CoinMark size="lg" />
            <h2 className="fx-h m-0" id="cta">
              Mulai dari catatan pertamamu
            </h2>
            <p className="max-w-[70ch] text-body">
              Lihat akun demo yang sudah berisi data contoh, tanpa perlu daftar.
            </p>
            <CtaButtons center />
          </section>
        </main>
        <footer className="l-foot">
          <Wordmark />
          <a className={cn(linkClasses, 'gap-2')} href="https://github.com">
            <GithubIcon />
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
