import { Link2, Plus, Smartphone } from 'lucide-react';
import type { CSSProperties } from 'react';
import { CoinMark } from '@/components/coinbook/coin-mark';
import { Passbook, type PassbookRow } from '@/components/coinbook/passbook';
import { ReceiptSlip } from '@/components/coinbook/receipt-slip';
import { Badge } from '@/components/ui/badge';

const SLIP_DATE = 'Sabtu, 15 Nov 2026';
const SLIP_TITLE = 'Patungan Warung Sate';

const row = (
  id: string,
  date: string,
  description: string,
  kind: PassbookRow['kind'],
  amount: number,
  balanceAfter: number,
): PassbookRow => ({ id, date, description, kind, amount, balanceAfter });

const style = (s: Record<string, string>) => s as CSSProperties;

export interface DecorProps {
  ring: Record<string, string>;
  coin: Record<string, string>;
  coinSize: number;
  plus: Record<string, string>;
}

export function Decor({ ring, coin, coinSize, plus }: DecorProps) {
  return (
    <div className="fx-decor" aria-hidden="true">
      <span className="dc-ring px" style={style(ring)} />
      <span className="dc-coin px" style={style(coin)}>
        <span className="coin dot block" style={{ width: coinSize, height: coinSize }} />
      </span>
      <Plus size={20} className="dc-plus px" style={style(plus)} />
    </div>
  );
}

export function HeroDesk() {
  return (
    <div className="hero-desk" aria-hidden="true">
      <Passbook
        balance="Rp4.250.000"
        showMonthLabels={false}
        bodyClassName="pb-4"
        months={[
          {
            label: 'November 2026',
            rows: [
              row('h1', '18/11', 'Makan siang', 'expense', 35000, 4250000),
              row('h2', '17/11', 'Netflix', 'expense', 54000, 4285000),
              row('h3', '15/11', 'Patungan dari Budi', 'income', 45500, 4339000),
            ],
          },
        ]}
      />
      <BudiSlip />
      <div className="coin-wrap">
        <CoinMark size="xl" />
      </div>
    </div>
  );
}

function BudiSlip({
  className,
  style: s,
  stamp,
}: {
  className?: string;
  style?: CSSProperties;
  stamp?: string;
}) {
  return (
    <ReceiptSlip
      title={SLIP_TITLE}
      date={SLIP_DATE}
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
      stampClassName={stamp}
      className={className}
      style={s}
    />
  );
}

export function LedgerVisual() {
  return (
    <>
      <Passbook
        className="max-w-[460px]"
        balance="Rp4.250.000"
        subline="BCA 3.120.000 · GoPay 530.000 · Tunai 600.000"
        showMonthLabels={false}
        bodyClassName="pb-4"
        months={[
          {
            label: 'November 2026',
            rows: [
              row('l1', '14/11', 'Bensin', 'expense', 30000, 4293500),
              row('l2', '12/11', 'Kopi', 'expense', 28000, 4323500),
              row('l3', '09/11', 'Isi GoPay dari BCA', 'transfer', 200000, 4663500),
              row('l4', '01/11', 'Gaji November', 'income', 5000000, 5488500),
            ],
          },
        ]}
      />
      <div
        className="fx-float px"
        style={style({ '--d': '36px', right: '-28px', top: '-40px', width: '210px' })}
      >
        <div className="wcov fx-tilt" style={style({ '--r': '3deg' })}>
          <div className="wcov-top">
            <span className="ty">
              <Smartphone size={18} />
              E-wallet
            </span>
            <div className="flex flex-col gap-1">
              <span className="nm">GoPay</span>
              <span className="bl">Rp530.000</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StripDay({ n, mark, today }: { n: number; mark?: 'due' | 'paid'; today?: boolean }) {
  return (
    <span className={today ? 'tdy' : undefined}>
      {mark ? (
        <CoinMark size="sm" ring={mark === 'paid'} />
      ) : (
        <i className="mx-auto my-0.5 !h-2 !w-px bg-rule-strong" />
      )}
      {mark || today ? <b>{n}</b> : n}
    </span>
  );
}

export function BillsVisual() {
  const line = 'flex min-h-11 flex-wrap items-center justify-between gap-3 py-2.5';
  return (
    <>
      <div className="w-full max-w-[460px] rounded-paper bg-paper px-5 pt-1 pb-2 shadow-paper">
        <div className="mini-strip">
          <StripDay n={15} />
          <StripDay n={16} mark="due" />
          <StripDay n={17} mark="paid" />
          <StripDay n={18} today />
          <StripDay n={19} mark="due" />
          <StripDay n={20} />
          <StripDay n={21} mark="due" />
        </div>
        <div className={line}>
          <span className="flex flex-col">
            <span className="font-medium">Internet</span>
            <span className="text-meta text-muted">16 Nov · Rp82.010</span>
          </span>
          <Badge variant="overdue">Terlambat 2 hari</Badge>
        </div>
        <div className={`${line} border-t border-dashed border-rule`}>
          <span className="flex flex-col">
            <span className="font-medium">Spotify</span>
            <span className="text-meta text-muted">19 Nov · Rp54.990</span>
          </span>
          <Badge variant="due">Jatuh tempo H-1</Badge>
        </div>
        <div className={`${line} relative border-t border-dashed border-rule`}>
          <span className="flex flex-col">
            <span className="font-medium">Netflix</span>
            <span className="text-meta text-muted">17 Nov · Rp54.000</span>
          </span>
          <Badge variant="paid">Lunas</Badge>
          <span className="stamp sm sv absolute top-3.5 right-[84px]">LUNAS</span>
        </div>
        <div className="mt-1 flex min-h-11 items-center justify-between gap-3 border-t border-rule">
          <span className="text-muted">Total langganan</span>
          <span className="font-medium">Rp441.000/bulan</span>
        </div>
      </div>
      <div
        className="fx-float px"
        style={style({ '--d': '44px', right: '-16px', top: '-16px', width: '280px' })}
      >
        <div className="notif fx-tilt" style={style({ '--r': '-2deg' })}>
          <span className="coin size-8 text-[15px]">C</span>
          <div className="flex flex-col gap-0.5">
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-medium">Coinbook</span>
              <span className="text-meta text-muted">Telegram · 07.00</span>
            </span>
            <p>Spotify Rp54.990 jatuh tempo besok, 19 Nov.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function SplitVisual() {
  return (
    <>
      <div className="fan">
        <ReceiptSlip
          title={SLIP_TITLE}
          date={SLIP_DATE}
          heading="Bagian Sari"
          groups={[
            [
              { label: 'Sate kambing', value: '52.000' },
              { label: 'Es jeruk', value: '8.000' },
              { label: 'Pajak + service', value: '18.000', muted: true },
            ],
          ]}
          total="Rp78.000"
          className="fx-tilt"
          style={style({ '--r': '-3deg' })}
        />
        <BudiSlip className="fx-tilt" style={style({ '--r': '4deg' })} stamp="sv" />
      </div>
      <div className="fx-float px" style={style({ '--d': '40px', right: '0', top: '0' })}>
        <span className="linkchip">
          <Link2 size={18} />
          coinbook.app/s/k7Qm2x
        </span>
      </div>
    </>
  );
}
