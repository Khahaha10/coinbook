'use client';

import type { CategoryDto, WalletDto } from '@coinbook/shared';
import { Funnel, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { rangeOptions, TYPE_OPTIONS, type FilterState, type Range } from '../filters';

export interface LedgerFiltersProps {
  state: FilterState;
  query: string;
  wallets: WalletDto[];
  categories: CategoryDto[];
  onChange: (patch: Partial<FilterState>) => void;
  onQueryChange: (q: string) => void;
}

type SelectFieldsProps = Omit<LedgerFiltersProps, 'query' | 'onQueryChange'> & { idPrefix: string };

function SelectFields({ state, wallets, categories, onChange, idPrefix }: SelectFieldsProps) {
  return (
    <>
      <Field label="Tanggal" htmlFor={`${idPrefix}-r`}>
        <Select
          id={`${idPrefix}-r`}
          value={state.range}
          onChange={(e) => onChange({ range: e.target.value as Range })}
        >
          {state.range === 'all' ? (
            <option value="all" hidden>
              {rangeOptions()[0]?.label}
            </option>
          ) : null}
          {rangeOptions().map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Dompet" htmlFor={`${idPrefix}-w`}>
        <Select
          id={`${idPrefix}-w`}
          value={state.walletId}
          onChange={(e) => onChange({ walletId: e.target.value })}
        >
          <option value="">Semua dompet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Kategori" htmlFor={`${idPrefix}-c`}>
        <Select
          id={`${idPrefix}-c`}
          value={state.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tipe" htmlFor={`${idPrefix}-t`}>
        <Select
          id={`${idPrefix}-t`}
          value={state.type}
          onChange={(e) => onChange({ type: e.target.value as FilterState['type'] })}
        >
          <option value="">Semua tipe</option>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}

export function LedgerFilters(props: LedgerFiltersProps) {
  const { query, onQueryChange } = props;
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <>
      <form
        className="mb-6 hidden max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 @min-[768px]/cb:grid"
        aria-label="Filter transaksi"
        onSubmit={(e) => e.preventDefault()}
      >
        <SelectFields {...props} idPrefix="t" />
        <Field label="Cari catatan" htmlFor="t-q">
          <Input
            id="t-q"
            icon={<Search size={18} />}
            placeholder="Misal: kopi"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </Field>
      </form>
      <div className="mb-4 flex gap-2 @min-[768px]/cb:hidden">
        <div className="min-w-0 flex-auto">
          <label htmlFor="t-qm" className="sr">
            Cari catatan
          </label>
          <Input
            id="t-qm"
            icon={<Search size={18} />}
            placeholder="Cari catatan"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          <Funnel size={20} aria-hidden="true" />
          Filter
        </Button>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Filter">
        <div className="flex flex-col gap-4">
          <SelectFields {...props} idPrefix="m" />
        </div>
      </Sheet>
    </>
  );
}
