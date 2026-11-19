'use client';

import type { CategoryDto, CategoryType } from '@coinbook/shared';
import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { CategoryIcon, PICKABLE_ICONS } from '@/components/ui/category-icon';
import { Segmented } from '@/components/ui/controls';
import { Field, Input } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { ApiError, DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/use-category-mutations';

export type CategorySheetState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; category: CategoryDto };

const TYPES = [
  { value: 'EXPENSE', label: 'Pengeluaran' },
  { value: 'INCOME', label: 'Pemasukan' },
] as const;

const NAME_ERROR = 'Nama belum diisi.';
const DUPLICATE_ERROR = 'Nama sudah ada.';
const IN_USE_ERROR = 'Kategori ini masih dipakai transaksi atau tagihan.';

function CategoryForm({ category, onDone }: { category?: CategoryDto; onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState<CategoryType>(category?.type ?? 'EXPENSE');
  const [icon, setIcon] = useState(category?.icon ?? PICKABLE_ICONS[0] ?? 'utensils');
  const [nameError, setNameError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const toast = useToast();

  const onError = (error: Error) => {
    if (error instanceof ApiError && error.code === 'DUPLICATE_NAME') setNameError(DUPLICATE_ERROR);
    else if (error instanceof ApiError && error.code === 'CATEGORY_IN_USE') toast.show(IN_USE_ERROR, 'error');
    else toast.show(DEFAULT_ERROR_MESSAGE, 'error');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(NAME_ERROR);
      return;
    }
    const done = { onSuccess: () => onDone(), onError };
    if (category) update.mutate({ id: category.id, input: { name: name.trim(), icon } }, done);
    else create.mutate({ name: name.trim(), type, icon }, done);
  };

  if (category && confirming) {
    return (
      <div className="flex flex-col gap-3 @min-[400px]/cb:flex-row-reverse">
        <Button
          className="@min-[400px]/cb:flex-1"
          disabled={remove.isPending}
          onClick={() => remove.mutate(category.id, { onSuccess: () => onDone(), onError })}
        >
          Hapus
        </Button>
        <Button variant="secondary" className="@min-[400px]/cb:flex-1" onClick={() => setConfirming(false)}>
          Batal
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <Field label="Nama" htmlFor="cf-name" error={nameError} errorId="cf-name-err">
        <Input
          id="cf-name"
          value={name}
          maxLength={80}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? 'cf-name-err' : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(undefined);
          }}
        />
      </Field>
      {category ? null : (
        <Field label="Tipe" labelAs="span">
          <Segmented label="Tipe" options={TYPES} value={type} onChange={setType} />
        </Field>
      )}
      <Field label="Ikon" labelAs="span">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ikon">
          {PICKABLE_ICONS.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={icon === n}
              aria-label={n}
              onClick={() => setIcon(n)}
              className={cn(
                'grid size-11 cursor-pointer place-items-center rounded-full border border-rule bg-paper text-text transition-[background-color,border-color] duration-150',
                icon === n && 'border-ink-700 bg-tag-bg text-tag-text',
              )}
            >
              <CategoryIcon name={n} size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      </Field>
      <Button type="submit" full disabled={create.isPending || update.isPending}>
        Simpan kategori
      </Button>
      {category ? (
        <Button variant="quiet" full onClick={() => setConfirming(true)}>
          <Trash2 size={20} aria-hidden="true" />
          Hapus {category.name}
        </Button>
      ) : null}
    </form>
  );
}

export function CategorySheet({ state, onClose }: { state: CategorySheetState; onClose: () => void }) {
  const title =
    state.mode === 'edit' ? `Ubah ${state.category.name}` : state.mode === 'create' ? 'Tambah kategori' : '';
  return (
    <Sheet open={state.mode !== 'closed'} onOpenChange={(open) => (open ? undefined : onClose())} title={title}>
      {state.mode === 'create' ? <CategoryForm onDone={onClose} /> : null}
      {state.mode === 'edit' ? (
        <CategoryForm key={state.category.id} category={state.category} onDone={onClose} />
      ) : null}
    </Sheet>
  );
}
