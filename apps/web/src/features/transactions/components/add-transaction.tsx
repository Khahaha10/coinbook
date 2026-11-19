'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { useCreateTransaction } from '../hooks/use-transaction-mutations';
import { TransactionForm, type TransactionFormValues } from './transaction-form';

interface AddTransactionApi {
  open: () => void;
  lastCreatedId: string | null;
}

const AddTransactionContext = createContext<AddTransactionApi | null>(null);

export function useAddTransaction(): AddTransactionApi {
  const ctx = useContext(AddTransactionContext);
  if (!ctx) throw new Error('useAddTransaction must be used inside AddTransactionProvider');
  return ctx;
}

export function AddTransactionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const wallets = useWallets();
  const categories = useCategories();
  const create = useCreateTransaction();
  const toast = useToast();

  const open = () => {
    setFormKey((k) => k + 1);
    setOpen(true);
  };

  const submit = ({ type, amount, walletId, toWalletId, categoryId, date, note }: TransactionFormValues) => {
    const base = { amount, walletId, date, note: note || undefined };
    const input =
      type === 'TRANSFER' ? { type, toWalletId, ...base } : { type, categoryId, ...base };
    create.mutate(input, {
      onSuccess: (tx) => {
        setLastCreatedId(tx.id);
        setOpen(false);
        toast.show('Transaksi disimpan');
      },
      onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
    });
  };

  return (
    <AddTransactionContext.Provider value={{ open, lastCreatedId }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setOpen} title="Catat transaksi">
        {wallets.data && categories.data ? (
          <TransactionForm
            key={formKey}
            wallets={wallets.data.data}
            categories={categories.data}
            pending={create.isPending}
            onSubmit={submit}
          />
        ) : null}
      </Sheet>
    </AddTransactionContext.Provider>
  );
}
