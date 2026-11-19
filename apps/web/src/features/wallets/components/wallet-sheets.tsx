'use client';

import { WALLET_TYPES, type WalletDto, type WalletType } from '@coinbook/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/controls';
import { Field, Input } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { useArchiveWallet, useCreateWallet, useUpdateWallet } from '../hooks/use-wallet-mutations';
import { WALLET_ICONS, WALLET_TYPE_LABELS } from '../wallet-types';

const NAME_ERROR = 'Nama belum diisi.';
const TYPE_OPTIONS = WALLET_TYPES.map((t) => {
  const Icon = WALLET_ICONS[t];
  return { value: t, label: WALLET_TYPE_LABELS[t], icon: <Icon size={18} aria-hidden="true" /> };
});

export type WalletSheetState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; wallet: WalletDto }
  | { mode: 'archive'; wallet: WalletDto };

function WalletForm({ wallet, onDone }: { wallet?: WalletDto; onDone: () => void }) {
  const [name, setName] = useState(wallet?.name ?? '');
  const [type, setType] = useState<WalletType>(wallet?.type ?? 'BANK');
  const [opening, setOpening] = useState<number | null>(null);
  const [nameError, setNameError] = useState(false);
  const create = useCreateWallet();
  const update = useUpdateWallet();
  const toast = useToast();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const callbacks = {
      onSuccess: () => {
        onDone();
        toast.show('Dompet disimpan');
      },
      onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
    };
    if (wallet) {
      update.mutate({ id: wallet.id, input: { name: name.trim(), type } }, callbacks);
    } else {
      create.mutate({ name: name.trim(), type, openingBalance: opening ?? 0 }, callbacks);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <Field label="Nama" htmlFor="wf-name" error={nameError ? NAME_ERROR : undefined} errorId="wf-name-err">
        <Input
          id="wf-name"
          value={name}
          maxLength={80}
          aria-invalid={nameError}
          aria-describedby={nameError ? 'wf-name-err' : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(false);
          }}
        />
      </Field>
      <Field label="Tipe" labelAs="span">
        <Segmented label="Tipe" options={TYPE_OPTIONS} value={type} onChange={setType} />
      </Field>
      {wallet ? null : (
        <Field label="Saldo awal" htmlFor="wf-open">
          <MoneyInput id="wf-open" value={opening} onValueChange={setOpening} />
        </Field>
      )}
      <Button type="submit" full disabled={create.isPending || update.isPending}>
        Simpan dompet
      </Button>
    </form>
  );
}

function ArchiveConfirm({ wallet, onDone }: { wallet: WalletDto; onDone: () => void }) {
  const archive = useArchiveWallet();
  const toast = useToast();
  return (
    <div className="flex flex-col gap-3 @min-[400px]/cb:flex-row-reverse">
      <Button
        className="@min-[400px]/cb:flex-1"
        disabled={archive.isPending}
        onClick={() =>
          archive.mutate(wallet.id, {
            onSuccess: () => {
              onDone();
              toast.show('Dompet diarsipkan');
            },
            onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
          })
        }
      >
        Arsipkan
      </Button>
      <Button variant="secondary" className="@min-[400px]/cb:flex-1" onClick={onDone}>
        Batal
      </Button>
    </div>
  );
}

const TITLES = {
  create: () => 'Tambah dompet',
  edit: (w: WalletDto) => `Edit ${w.name}`,
  archive: (w: WalletDto) => `Arsipkan ${w.name}`,
};

export function WalletSheets({ state, onClose }: { state: WalletSheetState; onClose: () => void }) {
  const title =
    state.mode === 'closed'
      ? ''
      : state.mode === 'create'
        ? TITLES.create()
        : TITLES[state.mode](state.wallet);
  return (
    <Sheet open={state.mode !== 'closed'} onOpenChange={(open) => (open ? undefined : onClose())} title={title}>
      {state.mode === 'create' ? <WalletForm onDone={onClose} /> : null}
      {state.mode === 'edit' ? <WalletForm key={state.wallet.id} wallet={state.wallet} onDone={onClose} /> : null}
      {state.mode === 'archive' ? <ArchiveConfirm wallet={state.wallet} onDone={onClose} /> : null}
    </Sheet>
  );
}
