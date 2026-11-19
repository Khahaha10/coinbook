'use client';

import {
  formatRupiah,
  monthOf,
  todayInJakarta,
  type BillDto,
  type CreateBillInput,
} from '@coinbook/shared';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Panel } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useMe } from '@/features/me/hooks/use-me';
import { useWallets } from '@/features/wallets/hooks/use-wallets';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { useBillCalendar, useBills, useCreateBill, useMarkBillPaid } from '../hooks/use-bills';
import { BillForm } from './bill-form';
import { BillRow } from './bill-row';
import { EditBill } from './edit-bill';
import { MonthStrip } from './month-strip';
import { PaymentsSheet } from './payments-sheet';

const WIDE = 1440;

export function BillsPage() {
  const today = todayInJakarta();
  const month = monthOf(today);
  const bills = useBills();
  const calendar = useBillCalendar(month);
  const wallets = useWallets();
  const categories = useCategories();
  const me = useMe();
  const create = useCreateBill();
  const pay = useMarkBillPaid();
  const toast = useToast();
  const [justPaid, setJustPaid] = useState<string[]>([]);
  const paying = useRef(new Set<string>());
  const [history, setHistory] = useState<BillDto | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const markPaid = (bill: BillDto) => {
    if (paying.current.has(bill.id)) return;
    paying.current.add(bill.id);
    pay.mutate(bill, {
      onSuccess: () => {
        setJustPaid((ids) => [...ids, bill.id]);
        toast.show('Ditandai lunas');
      },
      onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
      onSettled: () => paying.current.delete(bill.id),
    });
  };

  const save = (input: CreateBillInput) =>
    create.mutate(input, {
      onSuccess: () => {
        setSheetOpen(false);
        setFormKey((k) => k + 1);
        toast.show('Tagihan disimpan');
      },
      onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error'),
    });

  const openForm = () => {
    const panelName = document.getElementById('n-name');
    if (document.body.clientWidth >= WIDE && panelName) {
      panelName.focus();
      return;
    }
    setFormKey((k) => k + 1);
    setSheetOpen(true);
  };

  const formReady = wallets.data && categories.data && me.data;
  const form = (idPrefix: string) =>
    formReady ? (
      <BillForm
        key={`${idPrefix}-${formKey}`}
        idPrefix={idPrefix}
        wallets={wallets.data.data}
        categories={categories.data}
        defaultRemindDays={me.data.defaultRemindDays}
        pending={create.isPending}
        onSubmit={save}
      />
    ) : null;

  return (
    <>
      <header className="ph">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">
            Tagihan &amp; langganan
          </h1>
          {bills.data ? (
            <>
              <p className="text-body">
                Total tagihan:{' '}
                <span className="font-medium">{formatRupiah(bills.data.monthlyTotal)}/bulan</span>
              </p>
              <p className="text-meta text-muted-desk">
                {bills.data.activeCount} tagihan aktif. Tagihan tahunan dihitung per bulan.
              </p>
            </>
          ) : null}
        </div>
        <Button variant="secondary" onClick={openForm}>
          <Plus size={20} aria-hidden="true" />
          Tambah tagihan
        </Button>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @min-[1440px]/cb:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {calendar.data ? (
            <MonthStrip month={calendar.data.month} today={today} markers={calendar.data.markers} />
          ) : (
            <Panel className="h-36" aria-busy="true" />
          )}
          <Panel as="section" padded={false} className="px-5 py-1" aria-label="Daftar tagihan">
            {bills.data && bills.data.data.length === 0 ? (
              <p className="py-4 text-meta text-muted">
                Belum ada tagihan. Tambahkan langganan supaya diingatkan sebelum jatuh tempo.
              </p>
            ) : (
              <ul>
                {(bills.data?.data ?? []).map((bill) => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    justPaid={justPaid.includes(bill.id)}
                    paying={pay.isPending && pay.variables.id === bill.id}
                    onPay={markPaid}
                    onHistory={setHistory}
                    onEdit={(b) => setEditingId(b.id)}
                  />
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel
          as="aside"
          className="hidden @min-[1440px]/cb:block"
          aria-labelledby="b-new"
        >
          <h2 className="mb-4 text-h2 leading-[1.2] font-medium" id="b-new">
            Tagihan baru
          </h2>
          {form('n')}
        </Panel>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Tagihan baru">
        {form('s')}
      </Sheet>
      <PaymentsSheet bill={history} onClose={() => setHistory(null)} />
      <EditBill
        bill={bills.data?.data.find((b) => b.id === editingId) ?? null}
        onClose={() => setEditingId(null)}
      />
    </>
  );
}
