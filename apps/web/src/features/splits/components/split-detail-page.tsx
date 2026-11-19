'use client';

import { formatRupiah, type SplitDetailDto, type SplitPersonDto } from '@coinbook/shared';
import { ChevronLeft, Link2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ReceiptSlip, type SlipLine } from '@/components/coinbook/receipt-slip';
import { Panel, Tag } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useMe } from '@/features/me/hooks/use-me';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { useConfirmDebt, useSplit } from '../hooks/use-splits';
import { DebtStatusBadge } from './debt-status-badge';
import { extrasLabel, longDate, shareText } from '../split-format';

const ROW = 'flex min-h-11 items-center justify-between gap-3';

function slipGroups(split: SplitDetailDto, person: SplitPersonDto): SlipLine[][] {
  const lines = person.lines.map((l) => ({
    label: l.label,
    value: formatRupiah(l.amount, { prefix: false }),
  }));
  const extras =
    person.extras !== 0
      ? [
          {
            label: extrasLabel(split),
            value: formatRupiah(person.extras, { prefix: false }),
            muted: true,
          },
        ]
      : [];
  return [[...lines, ...extras]];
}

interface PersonSlotProps {
  split: SplitDetailDto;
  person: SplitPersonDto;
  ownerFirstName: string;
  justConfirmed: boolean;
  confirming: boolean;
  onConfirm: (person: SplitPersonDto) => void;
}

function PersonSlot({ split, person, ownerFirstName, justConfirmed, confirming, onConfirm }: PersonSlotProps) {
  const status = person.debt?.status;
  const paid = status === 'PAID';
  return (
    <div className="slot">
      <ReceiptSlip
        title={split.title}
        date={longDate(split.date)}
        heading={person.isOwner ? `Bagianmu (${ownerFirstName})` : `Bagian ${person.name}`}
        groups={slipGroups(split, person)}
        total={formatRupiah(person.share)}
        paid={!person.isOwner && paid}
        animateStamp={justConfirmed}
      />
      <div className="slot-act">
        {person.isOwner ? (
          <Tag>Bagianmu</Tag>
        ) : status ? (
          <DebtStatusBadge status={status} />
        ) : null}
        {!person.isOwner && !paid ? (
          <Button
            variant={status === 'PENDING' ? 'primary' : 'secondary'}
            onClick={() => onConfirm(person)}
            disabled={confirming}
          >
            Konfirmasi lunas<span className="sr"> untuk {person.name}</span>
          </Button>
        ) : null}
        {!person.isOwner && paid && person.debt?.wallet ? (
          <span className="text-meta text-muted-desk">Masuk ke {person.debt.wallet.name}</span>
        ) : null}
      </div>
    </div>
  );
}

export function SplitDetailPage({ id }: { id: string }) {
  const split = useSplit(id);
  const me = useMe();
  const confirm = useConfirmDebt(id);
  const toast = useToast();
  const [justConfirmed, setJustConfirmed] = useState<string[]>([]);
  const inFlight = useRef(new Set<string>());

  if (!split.data || !me.data) return <Panel className="h-64" aria-busy="true" />;
  const data = split.data;
  const ownerFirstName = me.data.name.split(/\s+/)[0] ?? me.data.name;
  const friends = data.people.filter((p) => !p.isOwner);
  const ordered = [...friends, ...data.people.filter((p) => p.isOwner)];
  const text = shareText(data, me.data.bankInfo);

  const copy = (value: string, message: string) =>
    navigator.clipboard
      .writeText(value)
      .then(() => toast.show(message))
      .catch(() => toast.show(DEFAULT_ERROR_MESSAGE, 'error'));

  const onConfirm = (person: SplitPersonDto) => {
    if (inFlight.current.has(person.id)) return;
    inFlight.current.add(person.id);
    confirm.mutate(person.id, {
      onSuccess: (detail) => {
        setJustConfirmed((ids) => [...ids, person.id]);
        const wallet = detail.people.find((p) => p.id === person.id)?.debt?.wallet?.name ?? detail.wallet.name;
        toast.show(`Dikonfirmasi lunas. ${formatRupiah(person.share)} masuk ke ${wallet}`);
      },
      onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
      onSettled: () => inFlight.current.delete(person.id),
    });
  };

  return (
    <>
      <Link className="back" href="/splits">
        <ChevronLeft size={18} aria-hidden="true" />
        Patungan
      </Link>
      <header className="ph">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">{data.title}</h1>
          <p className="text-meta text-muted-desk">
            {longDate(data.date)} · dibayar dari {data.wallet.name}
          </p>
          <p className="text-body">
            Total <span className="font-medium">{formatRupiah(data.grandTotal)}</span> ·{' '}
            {data.paidCount} dari {data.peopleCount} sudah lunas
          </p>
        </div>
        <div className="flex w-full max-w-[420px] flex-wrap gap-2">
          <Button
            variant="secondary"
            className="flex-auto @min-[768px]/cb:flex-none"
            onClick={() => void copy(data.shareUrl, 'Link disalin')}
          >
            <Link2 size={20} aria-hidden="true" />
            Salin link
          </Button>
          <Button
            variant="secondary"
            className="flex-auto @min-[768px]/cb:flex-none"
            onClick={() => void copy(text, 'Teks WhatsApp disalin')}
          >
            <MessageCircle size={20} aria-hidden="true" />
            Salin teks WhatsApp
          </Button>
        </div>
      </header>

      <div className="sd-grid">
        <section aria-label="Struk per orang">
          <div className="desk-slips">
            {ordered.map((person) => (
              <PersonSlot
                key={person.id}
                split={data}
                person={person}
                ownerFirstName={ownerFirstName}
                justConfirmed={justConfirmed.includes(person.id)}
                confirming={confirm.isPending && confirm.variables === person.id}
                onConfirm={onConfirm}
              />
            ))}
          </div>
        </section>
        <Panel as="aside" className="flex flex-col gap-4" aria-labelledby="sd-share">
          <h2 className="text-h2 leading-[1.2] font-medium" id="sd-share">
            Teks untuk dibagikan
          </h2>
          <p className="wa">{text}</p>
          <div className="flex flex-col gap-0.5">
            <div className={ROW}>
              <span className="text-muted">Sudah masuk</span>
              <span className="font-medium text-income">
                {formatRupiah(data.receivedTotal, { sign: true })}
              </span>
            </div>
            <div className={ROW}>
              <span className="text-muted">Belum masuk</span>
              <span className="font-medium">{formatRupiah(data.outstandingTotal)}</span>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
