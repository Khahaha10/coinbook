'use client';

import { formatRupiah, type WalletDto } from '@coinbook/shared';
import { Plus, X } from 'lucide-react';
import { useState, type Dispatch, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/controls';
import { DateInput, Field, Input, Select } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import {
  isDuplicateName,
  OWNER_KEY,
  type StepErrors,
  type WizardAction,
  type WizardState,
} from '../wizard-state';

const H2 = 'mb-1 text-h2 leading-[1.2] font-medium';
const DUPLICATE_ERROR = 'Nama sudah ada.';

interface StepProps {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  errors: StepErrors | null;
}

const initial = (name: string) => name.charAt(0).toUpperCase();

export function StepInfo({ state, dispatch, errors, wallets }: StepProps & { wallets: WalletDto[] }) {
  return (
    <>
      <h2 className={H2} id="wz-h">
        Info patungan
      </h2>
      <p className="mb-4 text-meta text-muted">Langkah 1 dari 4</p>
      <div className="flex flex-col gap-4">
        <Field label="Judul" htmlFor="w-t" error={errors?.title} errorId="w-t-err">
          <Input
            id="w-t"
            value={state.title}
            maxLength={80}
            aria-invalid={Boolean(errors?.title)}
            aria-describedby={errors?.title ? 'w-t-err' : undefined}
            onChange={(e) => dispatch({ type: 'info', patch: { title: e.target.value } })}
          />
        </Field>
        <Field label="Tanggal" htmlFor="w-d">
          <DateInput
            id="w-d"
            value={state.date}
            required
            onChange={(e) => dispatch({ type: 'info', patch: { date: e.target.value } })}
          />
        </Field>
        <Field
          label="Dompet yang dipakai bayar"
          htmlFor="w-w"
          hint="Uang dari teman nanti masuk ke dompet ini."
          hintId="w-w-hint"
        >
          <Select
            id="w-w"
            value={state.walletId}
            aria-describedby="w-w-hint"
            onChange={(e) => dispatch({ type: 'info', patch: { walletId: e.target.value } })}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </>
  );
}

export function StepPeople({ state, dispatch, errors }: StepProps) {
  const [name, setName] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isDuplicateName(state.people, trimmed)) {
      setDuplicate(true);
      return;
    }
    dispatch({ type: 'addPerson', name: trimmed });
    setName('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    add();
  };
  const error = duplicate ? DUPLICATE_ERROR : errors?.people;
  return (
    <>
      <h2 className={H2} id="wz-h">
        Siapa saja yang ikut?
      </h2>
      <p className="mb-4 text-meta text-muted">Cukup nama. Teman tidak perlu punya akun.</p>
      <ul className="chips mb-5" aria-label="Peserta">
        {state.people.map((p) => (
          <li key={p.key} className={p.key === OWNER_KEY ? 'pchip me' : 'pchip'}>
            <span className="av sm" aria-hidden="true">
              {initial(p.name)}
            </span>
            {p.name}
            {p.key === OWNER_KEY ? null : (
              <button
                type="button"
                className="x"
                aria-label={`Hapus ${p.name}`}
                onClick={() => dispatch({ type: 'removePerson', key: p.key })}
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <Field label="Nama teman" htmlFor="w-np" error={error} errorId="w-np-err">
        <div className="flex gap-2">
          <Input
            id="w-np"
            placeholder="Misal: Tari"
            maxLength={40}
            value={name}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'w-np-err' : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setDuplicate(false);
            }}
            onKeyDown={onKey}
          />
          <Button variant="secondary" onClick={add}>
            <Plus size={20} aria-hidden="true" />
            Tambah
          </Button>
        </div>
      </Field>
    </>
  );
}

export function StepItems({ state, dispatch, errors }: StepProps) {
  const subtotal = state.items.reduce((sum, it) => sum + (it.price ?? 0) * it.qty, 0);
  return (
    <>
      <h2 className={H2} id="wz-h">
        Item
      </h2>
      <p className="mb-3 text-meta text-muted">Ketuk nama orang yang ikut menanggung tiap item.</p>
      <ul>
        {state.items.map((it) => {
          const e = errors?.items[it.key];
          return (
            <li key={it.key} className="it">
              <div className="it-f">
                <Field label="Nama item" htmlFor={`${it.key}-n`} className="fn" error={e?.name} errorId={`${it.key}-n-err`}>
                  <Input
                    id={`${it.key}-n`}
                    value={it.name}
                    maxLength={80}
                    aria-invalid={Boolean(e?.name)}
                    onChange={(ev) => dispatch({ type: 'item', key: it.key, patch: { name: ev.target.value } })}
                  />
                </Field>
                <Field label="Harga" htmlFor={`${it.key}-p`} className="fp" error={e?.price} errorId={`${it.key}-p-err`}>
                  <MoneyInput
                    id={`${it.key}-p`}
                    value={it.price}
                    aria-invalid={Boolean(e?.price)}
                    onValueChange={(v) => dispatch({ type: 'item', key: it.key, patch: { price: v } })}
                  />
                </Field>
                <Field label="Jumlah" htmlFor={`${it.key}-q`} className="fq">
                  <Input
                    id={`${it.key}-q`}
                    inputMode="numeric"
                    value={String(it.qty)}
                    onChange={(ev) => {
                      const qty = Math.min(999, Math.max(1, Number(ev.target.value.replace(/\D/g, '')) || 1));
                      dispatch({ type: 'item', key: it.key, patch: { qty } });
                    }}
                  />
                </Field>
              </div>
              <div className="chips" role="group" aria-label="Ditanggung oleh">
                {state.people.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className="tog"
                    aria-pressed={it.personKeys.includes(p.key)}
                    onClick={() => dispatch({ type: 'togglePerson', itemKey: it.key, personKey: p.key })}
                  >
                    <span className="av sm" aria-hidden="true">
                      {initial(p.name)}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={e?.who ? 'text-meta text-overdue-text' : 'text-meta text-muted'}>
                  {it.personKeys.length
                    ? `Dibagi ${it.personKeys.length} orang`
                    : 'Belum ada yang menanggung'}
                </span>
                <span className="font-medium">{formatRupiah((it.price ?? 0) * it.qty)}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-1 flex min-h-11 items-center justify-between gap-3 border-t border-rule pt-2">
        <Button variant="quiet" className="-ml-3" onClick={() => dispatch({ type: 'addItem' })}>
          <Plus size={20} aria-hidden="true" />
          Tambah item
        </Button>
        <span>
          Subtotal <span className="font-medium">{formatRupiah(subtotal)}</span>
        </span>
      </div>
    </>
  );
}

const DISCOUNT_TYPES = [
  { value: 'NOMINAL', label: 'Nominal' },
  { value: 'PERCENT', label: 'Persen' },
] as const;

const percentText = (v: string) => v.replace(/[^\d.,]/g, '');

export function StepExtras({
  state,
  dispatch,
  summary,
  grandTotal,
}: StepProps & { summary: { name: string; total: number }[]; grandTotal: number }) {
  return (
    <>
      <h2 className={H2} id="wz-h">
        Biaya tambahan
      </h2>
      <p className="mb-4 text-meta text-muted">Dibagi proporsional sesuai pesanan tiap orang.</p>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @min-[400px]/cb:grid-cols-2">
          <Field label="Pajak (%)" htmlFor="w-tax">
            <Input
              id="w-tax"
              inputMode="decimal"
              value={state.tax}
              onChange={(e) => dispatch({ type: 'extras', patch: { tax: percentText(e.target.value) } })}
            />
          </Field>
          <Field label="Service (%)" htmlFor="w-svc">
            <Input
              id="w-svc"
              inputMode="decimal"
              value={state.service}
              onChange={(e) => dispatch({ type: 'extras', patch: { service: percentText(e.target.value) } })}
            />
          </Field>
        </div>
        <Field label="Diskon" htmlFor="w-disc">
          <Segmented
            label="Jenis diskon"
            className="mb-1"
            options={DISCOUNT_TYPES}
            value={state.discountType}
            onChange={(v) => dispatch({ type: 'extras', patch: { discountType: v, discountValue: null } })}
          />
          <MoneyInput
            id="w-disc"
            prefix={state.discountType === 'PERCENT' ? '%' : 'Rp'}
            value={state.discountValue}
            onValueChange={(v) =>
              dispatch({
                type: 'extras',
                patch: { discountValue: state.discountType === 'PERCENT' && v !== null ? Math.min(v, 100) : v },
              })
            }
          />
        </Field>
        <div className="border-t border-rule pt-2">
          {summary.map((r) => (
            <div key={r.name} className="flex min-h-9 items-center justify-between gap-3">
              <span>{r.name}</span>
              <span className="font-medium">{formatRupiah(r.total)}</span>
            </div>
          ))}
          <div className="mt-1 flex min-h-11 items-center justify-between gap-3 border-t border-dashed border-rule">
            <span className="font-medium">Total tagihan</span>
            <span className="font-medium">{formatRupiah(grandTotal)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
