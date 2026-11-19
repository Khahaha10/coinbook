'use client';

import { formatRupiah, todayInJakarta, type WalletDto } from '@coinbook/shared';
import { ArrowLeftRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Panel } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { useToast } from '@/components/ui/toast';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { useTransfer } from '../hooks/use-wallet-mutations';

const AMOUNT_ERROR = 'Nominal belum diisi. Ketik jumlah uangnya dulu.';

export function TransferPanel({ wallets }: { wallets: WalletDto[] }) {
  const [fromId, setFromId] = useState(wallets[0]?.id ?? '');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState(false);
  const transfer = useTransfer();
  const toast = useToast();

  const from = wallets.find((w) => w.id === fromId);
  const targets = wallets.filter((w) => w.id !== fromId);
  const selectedTo = targets.some((w) => w.id === toId) ? toId : (targets[0]?.id ?? '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setAmountError(true);
      return;
    }
    transfer.mutate(
      {
        fromWalletId: fromId,
        toWalletId: selectedTo,
        amount,
        date: todayInJakarta(),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setAmount(null);
          setNote('');
          toast.show('Transfer disimpan');
        },
        onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
      },
    );
  };

  return (
    <Panel as="section" aria-labelledby="w-tr">
      <h2 className="flex items-center gap-2 text-h2 leading-[1.2] font-medium" id="w-tr">
        <ArrowLeftRight size={20} aria-hidden="true" />
        Transfer antar dompet
      </h2>
      <p className="mt-1 mb-4 text-meta text-muted">
        Tidak dihitung sebagai pemasukan atau pengeluaran.
      </p>
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @min-[400px]/cb:grid-cols-2">
          <Field label="Dari" htmlFor="w-from">
            <Select id="w-from" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ke" htmlFor="w-to">
            <Select id="w-to" value={selectedTo} onChange={(e) => setToId(e.target.value)}>
              {targets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Nominal"
          htmlFor="w-amt"
          error={amountError ? AMOUNT_ERROR : undefined}
          errorId="w-amt-err"
          hint={
            from && amount
              ? `Saldo ${from.name} setelah transfer: ${formatRupiah(from.balance - amount)}`
              : undefined
          }
          hintId="w-amt-hint"
        >
          <MoneyInput
            id="w-amt"
            value={amount}
            aria-invalid={amountError}
            aria-describedby={amountError ? 'w-amt-err' : from && amount ? 'w-amt-hint' : undefined}
            onValueChange={(v) => {
              setAmount(v);
              setAmountError(false);
            }}
          />
        </Field>
        <Field label="Catatan" htmlFor="w-note">
          <Input
            id="w-note"
            placeholder="Misal: isi saldo"
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <Button type="submit" full disabled={transfer.isPending || targets.length === 0}>
          Simpan transfer
        </Button>
      </form>
    </Panel>
  );
}
