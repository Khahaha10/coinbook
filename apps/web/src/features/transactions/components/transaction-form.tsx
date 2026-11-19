'use client';

import {
  todayInJakarta,
  type CategoryDto,
  type CreateTransactionInput,
  type TransactionType,
  type WalletDto,
} from '@coinbook/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/controls';
import { DateInput, Field, Input, Select } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';

const TYPES = [
  { value: 'EXPENSE', label: 'Pengeluaran' },
  { value: 'INCOME', label: 'Pemasukan' },
  { value: 'TRANSFER', label: 'Transfer' },
] as const;

const AMOUNT_ERROR = 'Nominal belum diisi. Ketik jumlah uangnya dulu.';

export interface TransactionFormProps {
  wallets: WalletDto[];
  categories: CategoryDto[];
  pending: boolean;
  onSubmit: (input: CreateTransactionInput) => void;
}

export function TransactionForm({ wallets, categories, pending, onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<number | null>(null);
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '');
  const [toWalletId, setToWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayInJakarta());
  const [amountError, setAmountError] = useState(false);

  const isTransfer = type === 'TRANSFER';
  const typeCategories = categories.filter((c) => c.type === type);
  const toWallets = wallets.filter((w) => w.id !== walletId);
  const selectedCategory = typeCategories.some((c) => c.id === categoryId)
    ? categoryId
    : (typeCategories[0]?.id ?? '');
  const selectedToWallet = toWallets.some((w) => w.id === toWalletId)
    ? toWalletId
    : (toWallets[0]?.id ?? '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setAmountError(true);
      return;
    }
    const base = { amount, walletId, date: date || todayInJakarta(), note: note.trim() || undefined };
    onSubmit(
      isTransfer
        ? { type: 'TRANSFER', toWalletId: selectedToWallet, ...base }
        : { type, categoryId: selectedCategory, ...base },
    );
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <Segmented
        label="Tipe transaksi"
        options={TYPES}
        value={type}
        onChange={(v) => setType(v)}
      />
      <Field label="Nominal" htmlFor="f-n" error={amountError ? AMOUNT_ERROR : undefined} errorId="f-n-err">
        <MoneyInput
          id="f-n"
          large
          value={amount}
          onValueChange={(v) => {
            setAmount(v);
            setAmountError(false);
          }}
          aria-invalid={amountError}
          aria-describedby={amountError ? 'f-n-err' : undefined}
        />
      </Field>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @min-[400px]/cb:grid-cols-2">
        {isTransfer ? (
          <Field label="Ke dompet" htmlFor="f-to">
            <Select id="f-to" value={selectedToWallet} onChange={(e) => setToWalletId(e.target.value)}>
              {toWallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Kategori" htmlFor="f-c">
            <Select id="f-c" value={selectedCategory} onChange={(e) => setCategoryId(e.target.value)}>
              {typeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={isTransfer ? 'Dari dompet' : 'Dompet'} htmlFor="f-w">
          <Select id="f-w" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Tanggal" htmlFor="f-d">
        <DateInput id="f-d" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      <Field label="Catatan" htmlFor="f-note">
        <Input
          id="f-note"
          placeholder="Misal: makan malam"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <Button type="submit" full disabled={pending}>
        Simpan transaksi
      </Button>
    </form>
  );
}
