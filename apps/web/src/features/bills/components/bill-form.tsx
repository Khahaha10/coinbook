'use client';

import {
  REMIND_DAY_OPTIONS,
  todayInJakarta,
  type BillCycle,
  type BillDto,
  type CategoryDto,
  type CreateBillInput,
  type WalletDto,
} from '@coinbook/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Segmented, ToggleChip } from '@/components/ui/controls';
import { DateInput, Field, Input, Select } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';

const CYCLES = [
  { value: 'MONTHLY', label: 'Bulanan' },
  { value: 'YEARLY', label: 'Tahunan' },
] as const;

const REMIND_LABELS: Record<number, string> = { 3: 'H-3', 1: 'H-1', 0: 'Hari H' };
const NAME_ERROR = 'Nama belum diisi.';
const AMOUNT_ERROR = 'Nominal belum diisi. Ketik jumlah uangnya dulu.';

export interface BillFormProps {
  idPrefix: string;
  wallets: WalletDto[];
  categories: CategoryDto[];
  defaultRemindDays: number[];
  pending: boolean;
  initial?: BillDto;
  footer?: ReactNode;
  onSubmit: (input: CreateBillInput) => void;
}

export function BillForm({
  idPrefix,
  wallets,
  categories,
  defaultRemindDays,
  pending,
  initial,
  footer,
  onSubmit,
}: BillFormProps) {
  const active = wallets.filter((w) => !w.isArchived || w.id === initial?.wallet.id);
  const expense = categories.filter((c) => c.type === 'EXPENSE');
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState<number | null>(initial?.amount ?? null);
  const [cycle, setCycle] = useState<BillCycle>(initial?.cycle ?? 'MONTHLY');
  const [dueDate, setDueDate] = useState(initial?.nextDueDate ?? todayInJakarta());
  const [walletId, setWalletId] = useState(initial?.wallet.id ?? active[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(initial?.category.id ?? expense[0]?.id ?? '');
  const [remindDays, setRemindDays] = useState<number[]>(initial?.remindDays ?? defaultRemindDays);
  const [errors, setErrors] = useState({ name: false, amount: false });
  const id = (key: string) => `${idPrefix}-${key}`;

  const toggleRemind = (day: number, on: boolean) =>
    setRemindDays((days) => (on ? [...days, day] : days.filter((d) => d !== day)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = { name: !name.trim(), amount: !amount };
    setErrors(next);
    if (next.name || next.amount || !amount) return;
    onSubmit({
      name: name.trim(),
      amount,
      cycle,
      dueDate: dueDate || todayInJakarta(),
      walletId,
      categoryId,
      remindDays: REMIND_DAY_OPTIONS.filter((d) => remindDays.includes(d)),
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <Field
        label="Nama"
        htmlFor={id('name')}
        error={errors.name ? NAME_ERROR : undefined}
        errorId={id('name-err')}
      >
        <Input
          id={id('name')}
          value={name}
          maxLength={80}
          aria-invalid={errors.name}
          aria-describedby={errors.name ? id('name-err') : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((v) => ({ ...v, name: false }));
          }}
        />
      </Field>
      <Field
        label="Nominal"
        htmlFor={id('amt')}
        error={errors.amount ? AMOUNT_ERROR : undefined}
        errorId={id('amt-err')}
      >
        <MoneyInput
          id={id('amt')}
          value={amount}
          aria-invalid={errors.amount}
          aria-describedby={errors.amount ? id('amt-err') : undefined}
          onValueChange={(v) => {
            setAmount(v);
            setErrors((s) => ({ ...s, amount: false }));
          }}
        />
      </Field>
      <Field label="Siklus" labelAs="span">
        <Segmented label="Siklus" options={CYCLES} value={cycle} onChange={setCycle} />
      </Field>
      <Field label="Jatuh tempo" htmlFor={id('due')}>
        <DateInput
          id={id('due')}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </Field>
      <Field label="Dompet" htmlFor={id('w')}>
        <Select id={id('w')} value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          {active.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Kategori" htmlFor={id('c')}>
        <Select id={id('c')} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {expense.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Pengingat" labelAs="span">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pengingat">
          {REMIND_DAY_OPTIONS.map((day) => (
            <ToggleChip
              key={day}
              pressed={remindDays.includes(day)}
              onPressedChange={(on) => toggleRemind(day, on)}
            >
              {REMIND_LABELS[day]}
            </ToggleChip>
          ))}
        </div>
      </Field>
      <Button type="submit" full disabled={pending}>
        Simpan tagihan
      </Button>
      {footer}
    </form>
  );
}
