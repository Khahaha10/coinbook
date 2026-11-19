'use client';

import { formatRupiah } from '@coinbook/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CoinMark, Wordmark } from '@/components/coinbook/coin-mark';
import { LunasStamp } from '@/components/coinbook/lunas-stamp';
import { Passbook, type PassbookRow } from '@/components/coinbook/passbook';
import { ReceiptSlip } from '@/components/coinbook/receipt-slip';
import { Panel } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';

const ROWS: PassbookRow[] = [
  {
    id: '1',
    date: '18/11',
    description: 'Makan siang',
    kind: 'expense',
    amount: 35000,
    balanceAfter: 4250000,
  },
  {
    id: '2',
    date: '17/11',
    description: 'Netflix',
    tag: 'Tagihan',
    kind: 'expense',
    amount: 54000,
    balanceAfter: 4285000,
  },
  {
    id: '3',
    date: '15/11',
    description: 'Patungan dari Budi',
    tag: 'Patungan',
    kind: 'income',
    amount: 45500,
    balanceAfter: 4339000,
  },
  {
    id: '4',
    date: '14/11',
    description: 'Bensin',
    kind: 'expense',
    amount: 30000,
    balanceAfter: 4293500,
  },
  {
    id: '5',
    date: '12/11',
    description: 'Kopi',
    kind: 'expense',
    amount: 28000,
    balanceAfter: 4323500,
  },
];

const TRANSFER: PassbookRow = {
  id: 't',
  date: '09/11',
  description: 'Isi GoPay dari BCA',
  kind: 'transfer',
  amount: 200000,
  balanceAfter: 4663500,
};

export function SignatureBoard({ theme }: { theme: 'light' | 'dark' }) {
  const [printed, setPrinted] = useState<PassbookRow[]>([]);
  const [stampKey, setStampKey] = useState(0);
  const balance = 4250000 - printed.reduce((s, r) => s + r.amount, 0);

  const print = (): void => {
    const amount = 25000;
    setPrinted((rows) => [
      {
        id: `n${rows.length}`,
        date: '18/11',
        description: 'Makan malam',
        kind: 'expense',
        amount,
        balanceAfter: balance - amount,
        isNew: true,
      },
      ...rows.map((r) => ({ ...r, isNew: false })),
    ]);
  };

  return (
    <section data-theme={theme} className="flex flex-col gap-8 bg-desk p-8 text-text">
      <h2 className="text-h2 leading-[1.2] font-medium">Signature · {theme}</h2>

      <div className="grid grid-cols-2 gap-8">
        <Panel className="flex flex-wrap items-center gap-8 p-8">
          <Wordmark />
          <CoinMark size="lg" />
          <span className="inline-flex items-center gap-1.5">
            <CoinMark size="sm" />
            <span className="text-meta text-muted">Penanda jatuh tempo</span>
          </span>
          <CoinMark size="sm" ring />
          <CoinMark size="xl" />
        </Panel>
        <Panel className="flex items-center justify-around gap-6 p-8">
          <LunasStamp />
          <LunasStamp size="sm" />
          <LunasStamp key={stampKey} animate />
          <Button variant="secondary" onClick={() => setStampKey((k) => k + 1)}>
            Ulang cap
          </Button>
        </Panel>
      </div>

      <div className="flex items-start gap-8">
        <div className="w-[720px] shrink-0">
          <Passbook
            balance={formatRupiah(balance)}
            months={[{ label: 'November 2026', rows: [...printed, ...ROWS] }]}
            footer={
              <>
                <span className="text-meta text-muted">5 transaksi terakhir</span>
                <a
                  className="inline-flex min-h-11 items-center font-medium no-underline hover:underline"
                  href="#signature"
                >
                  Lihat semua
                </a>
              </>
            }
          />
          <Button variant="secondary" className="mt-3" onClick={print}>
            <Plus size={20} aria-hidden="true" />
            Cetak baris baru
          </Button>
        </div>
        <div className="flex w-[343px] shrink-0 flex-col gap-6">
          <Passbook
            balance="Rp4.250.000"
            subline="BCA 3.120.000 · GoPay 530.000 · Tunai 600.000"
            months={[{ label: 'November 2026', rows: [...ROWS.slice(0, 3), TRANSFER] }]}
          />
          <Passbook
            balance="Rp0"
            months={[{ label: 'November 2026', rows: [] }]}
            empty={
              <>
                <p className="max-w-[70ch] text-body">
                  Belum ada catatan bulan ini. Catat pengeluaran pertamamu.
                </p>
                <a className={buttonClasses()} href="#signature">
                  <Plus size={20} aria-hidden="true" />
                  Catat pengeluaran
                </a>
              </>
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-12">
        <ReceiptSlip
          title="Patungan Warung Sate"
          date="Sabtu, 15 Nov 2026"
          heading="Bagian Budi"
          groups={[
            [
              { label: 'Sate ayam ½', value: '30.000' },
              { label: 'Es teh', value: '5.000' },
              { label: 'Pajak + service', value: '10.500', muted: true },
            ],
          ]}
          total="Rp45.500"
          paid
        />
        <ReceiptSlip
          title="Patungan Warung Sate"
          date="Sabtu, 15 Nov 2026"
          heading="Bagian Sari"
          groups={[
            [
              { label: 'Sate kambing', value: '52.000' },
              { label: 'Es jeruk', value: '8.000' },
              { label: 'Pajak + service', value: '18.000', muted: true },
            ],
          ]}
          total="Rp78.000"
          highlighted
        />
        <ReceiptSlip
          title="Patungan Warung Sate"
          date="Sabtu, 15 Nov 2026"
          groups={[
            [
              { label: 'Sate ayam', value: '60.000' },
              { label: 'Sate kambing', value: '52.000' },
              { label: 'Es teh ×3', value: '15.000' },
              { label: 'Es jeruk', value: '8.000' },
            ],
            [
              { label: 'Subtotal', value: '135.000' },
              { label: 'Pajak 10%', value: '13.500', muted: true },
              { label: 'Service 20%', value: '27.000', muted: true },
            ],
          ]}
          total="Rp175.500"
          note="Dibayar dulu oleh Rani"
        />
      </div>
    </section>
  );
}
