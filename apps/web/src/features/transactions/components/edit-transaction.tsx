'use client';

import type { TransactionDto, UpdateTransactionInput } from '@coinbook/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { useDeleteTransaction, useUpdateTransaction } from '../hooks/use-transaction-mutations';
import { TransactionForm, type TransactionFormValues } from './transaction-form';

function toUpdate(tx: TransactionDto, v: TransactionFormValues): UpdateTransactionInput {
  const note = v.note || null;
  if (tx.source !== 'MANUAL') return { note };
  const base = { amount: v.amount, walletId: v.walletId, date: v.date, note };
  return tx.type === 'TRANSFER'
    ? { ...base, toWalletId: v.toWalletId }
    : { ...base, categoryId: v.categoryId };
}

export interface EditTransactionProps {
  transaction: TransactionDto | null;
  onClose: () => void;
}

export function EditTransaction({ transaction, onClose }: EditTransactionProps) {
  const [confirming, setConfirming] = useState(false);
  const wallets = useWallets();
  const categories = useCategories();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  const toast = useToast();
  const locked = transaction?.source !== 'MANUAL';

  const close = () => {
    setConfirming(false);
    onClose();
  };

  const save = (values: TransactionFormValues) => {
    if (!transaction) return;
    update.mutate(
      { id: transaction.id, input: toUpdate(transaction, values) },
      {
        onSuccess: () => {
          close();
          toast.show('Transaksi disimpan');
        },
        onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
      },
    );
  };

  const destroy = () => {
    if (!transaction) return;
    remove.mutate(transaction.id, {
      onSuccess: () => {
        close();
        toast.show('Transaksi dihapus');
      },
      onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
    });
  };

  const name = transaction?.description ?? '';

  return (
    <Sheet
      open={transaction !== null}
      onOpenChange={(open) => (open ? undefined : close())}
      title={confirming ? `Hapus ${name}` : `Ubah ${name}`}
    >
      {transaction && wallets.data && categories.data ? (
        confirming ? (
          <div className="flex flex-col gap-3 @min-[400px]/cb:flex-row-reverse">
            <Button
              className="@min-[400px]/cb:flex-1"
              onClick={destroy}
              disabled={remove.isPending}
            >
              Hapus
            </Button>
            <Button
              variant="secondary"
              className="@min-[400px]/cb:flex-1"
              onClick={() => setConfirming(false)}
            >
              Batal
            </Button>
          </div>
        ) : (
          <TransactionForm
            key={transaction.id}
            wallets={wallets.data.data}
            categories={categories.data}
            pending={update.isPending}
            initial={transaction}
            locked={locked}
            onSubmit={save}
            footer={
              locked ? null : (
                <Button variant="quiet" full onClick={() => setConfirming(true)}>
                  <Trash2 size={20} aria-hidden="true" />
                  Hapus {name}
                </Button>
              )
            }
          />
        )
      ) : null}
    </Sheet>
  );
}
