'use client';

import {
  formatRupiah,
  itemLabel,
  type PublicSplitDto,
  type PublicSplitPersonDto,
} from '@coinbook/shared';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Wordmark } from '@/components/coinbook/coin-mark';
import { ReceiptSlip, type SlipLine } from '@/components/coinbook/receipt-slip';
import { Badge, Panel } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { parse, send } from '@/lib/api/request';
import { extrasLabel, longDate } from '../split-format';

const amount = (n: number) => formatRupiah(n, { prefix: false });
const percent = (bps: number) => `${(bps / 100).toLocaleString('id-ID')}%`;

function receiptGroups(split: PublicSplitDto): SlipLine[][] {
  const r = split.receipt;
  const items = r.items.map((it) => ({ label: itemLabel(it.name, it.qty, 1), value: amount(it.total) }));
  const extras: SlipLine[] = [{ label: 'Subtotal', value: amount(r.subtotal) }];
  if (r.taxBps > 0) extras.push({ label: `Pajak ${percent(r.taxBps)}`, value: amount(r.taxAmount), muted: true });
  if (r.serviceBps > 0) {
    extras.push({ label: `Service ${percent(r.serviceBps)}`, value: amount(r.serviceAmount), muted: true });
  }
  if (r.discountAmount > 0) {
    extras.push({ label: 'Diskon', value: formatRupiah(-r.discountAmount, { prefix: false }), muted: true });
  }
  return [items, extras];
}

function personGroups(split: PublicSplitDto, person: PublicSplitPersonDto): SlipLine[][] {
  const lines = person.lines.map((l) => ({ label: l.label, value: amount(l.amount) }));
  const extras =
    person.extras !== 0
      ? [{ label: extrasLabel(split.receipt), value: amount(person.extras), muted: true }]
      : [];
  return [[...lines, ...extras]];
}

function accountNumber(bankInfo: string): string {
  return bankInfo.match(/\d[\d\s-]{5,}\d/)?.[0].replace(/\D/g, '') ?? bankInfo;
}

function defaultPerson(friends: PublicSplitPersonDto[]): string {
  return (friends.find((p) => p.status === 'UNPAID') ?? friends[0])?.id ?? '';
}

export function PublicSplitView({ token, initial }: { token: string; initial: PublicSplitDto }) {
  const [split, setSplit] = useState(initial);
  const friends = split.people.filter((p) => !p.isOwner);
  const [selectedId, setSelectedId] = useState(() => defaultPerson(friends));
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const me = friends.find((p) => p.id === selectedId);
  const date = longDate(split.date);

  const copyAccount = (bankInfo: string) =>
    navigator.clipboard
      .writeText(accountNumber(bankInfo))
      .then(() => setCopied(true))
      .catch(() => toast.show(DEFAULT_ERROR_MESSAGE, 'error'));

  const markSent = async (personId: string) => {
    if (sending) return;
    setSending(true);
    try {
      const response = await send(`/public/splits/${token}/people/${personId}/paid`, { method: 'POST' }, undefined);
      setSplit(await parse<PublicSplitDto>(response));
      setCopied(false);
    } catch {
      toast.show(DEFAULT_ERROR_MESSAGE, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pub">
      <header className="pub-top">
        <Wordmark />
      </header>
      <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
        <p className="text-meta text-muted-desk">{split.ownerName} membagikan patungan ini</p>
        <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">{split.title}</h1>
        <p className="text-meta text-muted-desk">
          {date} · total {formatRupiah(split.receipt.grandTotal)}
        </p>
      </div>
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="text-[13px] font-medium" id="who-lbl">
          Kamu yang mana?
        </span>
        <div className="chips justify-center" role="group" aria-labelledby="who-lbl">
          {friends.map((p) => (
            <button
              key={p.id}
              type="button"
              className="tog"
              aria-pressed={p.id === selectedId}
              onClick={() => {
                setSelectedId(p.id);
                setCopied(false);
              }}
            >
              <span className="av sm" aria-hidden="true">
                {p.name.charAt(0).toUpperCase()}
              </span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pub-grid">
        <section className="pub-full" aria-label="Struk lengkap">
          <ReceiptSlip
            title={split.title}
            date={date}
            groups={receiptGroups(split)}
            total={formatRupiah(split.receipt.grandTotal)}
            note={`Dibayar dulu oleh ${split.ownerFirstName}`}
          />
        </section>
        {me ? (
          <section className="pub-mine" aria-labelledby="mine-h">
            <h2 className="text-center text-h2 leading-[1.2] font-medium" id="mine-h">
              Bagianmu, {me.name}
            </h2>
            <ReceiptSlip
              title={split.title}
              date={date}
              heading={`Bagian ${me.name}`}
              groups={personGroups(split, me)}
              total={formatRupiah(me.share)}
              highlighted
              paid={me.status === 'PAID'}
            />
            {me.status === 'UNPAID' ? (
              <Panel className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-meta text-muted">Yang perlu kamu transfer</span>
                  <span className="text-[28px] leading-[1.2] font-medium">{formatRupiah(me.share)}</span>
                </div>
                {split.bankInfo ? (
                  <div className="flex min-h-11 items-center justify-between gap-2 rounded-control bg-desk py-2 pr-2 pl-3.5">
                    <span className="text-body">Transfer ke {split.bankInfo}</span>
                    <Button
                      variant="secondary"
                      icon
                      aria-label="Salin nomor rekening"
                      onClick={() => {
                        const bankInfo = split.bankInfo;
                        if (bankInfo) void copyAccount(bankInfo);
                      }}
                    >
                      <Copy size={20} aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}
                <Button full onClick={() => void markSent(me.id)} disabled={sending}>
                  Saya sudah transfer
                </Button>
              </Panel>
            ) : null}
            {me.status === 'PENDING' ? (
              <Panel role="status" className="flex items-start gap-3">
                <Check size={20} aria-hidden="true" className="mt-0.5 flex-none text-income" />
                <div className="flex flex-col gap-1.5">
                  <p className="font-medium">
                    Terima kasih! {split.ownerFirstName} akan mengonfirmasi pembayaranmu.
                  </p>
                  <Badge variant="waiting" className="self-start">
                    Menunggu konfirmasi
                  </Badge>
                </div>
              </Panel>
            ) : null}
            {me.status === 'PAID' ? (
              <Panel className="flex items-center gap-3">
                <Badge variant="paid">Lunas</Badge>
                <p className="text-body">Bagianmu sudah lunas. Makasih!</p>
              </Panel>
            ) : null}
            {copied ? (
              <p className="text-center text-meta text-muted-desk" role="status">
                Nomor rekening disalin
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
      <p className="mt-12 text-center text-meta text-muted-desk">
        Dibuat dengan Coinbook. Kamu tidak perlu punya akun untuk melihat halaman ini.
      </p>
    </div>
  );
}
