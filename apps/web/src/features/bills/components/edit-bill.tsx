'use client';

import type { BillDto, CreateBillInput, UpdateBillInput } from '@coinbook/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useMe } from '@/features/me/hooks/use-me';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { useDeactivateBill, useUpdateBill } from '../hooks/use-bills';
import { BillForm } from './bill-form';

function changes(bill: BillDto, next: CreateBillInput): UpdateBillInput {
  const before: CreateBillInput = {
    name: bill.name,
    amount: bill.amount,
    cycle: bill.cycle,
    dueDate: bill.nextDueDate,
    walletId: bill.wallet.id,
    categoryId: bill.category.id,
    remindDays: bill.remindDays as CreateBillInput['remindDays'],
  };
  const keys = Object.keys(next) as (keyof CreateBillInput)[];
  return Object.fromEntries(
    keys
      .filter((k) => JSON.stringify(next[k]) !== JSON.stringify(before[k]))
      .map((k) => [k, next[k]]),
  );
}

export interface EditBillProps {
  bill: BillDto | null;
  onClose: () => void;
}

export function EditBill({ bill, onClose }: EditBillProps) {
  const [confirming, setConfirming] = useState(false);
  const wallets = useWallets();
  const categories = useCategories();
  const me = useMe();
  const update = useUpdateBill();
  const deactivate = useDeactivateBill();
  const toast = useToast();

  const close = () => {
    setConfirming(false);
    onClose();
  };

  const save = (input: CreateBillInput) => {
    if (!bill) return;
    const diff = changes(bill, input);
    if (Object.keys(diff).length === 0) {
      close();
      return;
    }
    update.mutate(
      { id: bill.id, input: diff },
      {
        onSuccess: () => {
          close();
          toast.show('Tagihan disimpan');
        },
        onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
      },
    );
  };

  const destroy = () => {
    if (!bill) return;
    deactivate.mutate(bill.id, {
      onSuccess: () => {
        close();
        toast.show('Tagihan dihapus');
      },
      onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
    });
  };

  const name = bill?.name ?? '';

  return (
    <Sheet
      open={bill !== null}
      onOpenChange={(open) => (open ? undefined : close())}
      title={confirming ? `Hapus ${name}` : `Ubah ${name}`}
    >
      {bill && wallets.data && categories.data && me.data ? (
        confirming ? (
          <div className="flex flex-col gap-3 @min-[400px]/cb:flex-row-reverse">
            <Button
              className="@min-[400px]/cb:flex-1"
              onClick={destroy}
              disabled={deactivate.isPending}
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
          <BillForm
            key={bill.id}
            idPrefix="e"
            wallets={wallets.data.data}
            categories={categories.data}
            defaultRemindDays={me.data.defaultRemindDays}
            pending={update.isPending}
            initial={bill}
            onSubmit={save}
            footer={
              <Button variant="quiet" full onClick={() => setConfirming(true)}>
                <Trash2 size={20} aria-hidden="true" />
                Hapus {name}
              </Button>
            }
          />
        )
      ) : null}
    </Sheet>
  );
}
