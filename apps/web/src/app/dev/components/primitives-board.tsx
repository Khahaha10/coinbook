'use client';

import { Copy, Monitor, Moon, Search, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Badge, Panel, Tag } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { Segmented, Switch, ToggleChip } from '@/components/ui/controls';
import { Field, Input, Select } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';

type TxType = 'out' | 'in' | 'tr';
type ThemeChoice = 'light' | 'dark' | 'system';

export function PrimitivesBoard({ theme }: { theme: 'light' | 'dark' }) {
  const id = (name: string): string => `${theme}-${name}`;
  const toast = useToast();
  const [amount, setAmount] = useState<number | null>(45500);
  const [empty, setEmpty] = useState<number | null>(null);
  const [type, setType] = useState<TxType>('out');
  const [look, setLook] = useState<ThemeChoice>('light');
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  const [days, setDays] = useState({ h3: true, h1: true, h0: false });
  const [open, setOpen] = useState(false);

  return (
    <section data-theme={theme} className="flex flex-col gap-6 bg-desk p-8 text-text">
      <h2 className="text-h2 leading-[1.2] font-medium">Primitives · {theme}</h2>

      <Panel className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Simpan transaksi</Button>
          <Button className="bg-primary-hover">Hover</Button>
          <Button className="outline-2 outline-offset-2 outline-ink-700">Fokus</Button>
          <Button disabled>Nonaktif</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary">Masuk</Button>
          <Button variant="secondary">
            <Copy size={20} aria-hidden="true" />
            Salin link
          </Button>
          <Button variant="quiet">Lihat semua</Button>
          <Button variant="secondary" icon aria-label="Tutup">
            <X size={20} aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href="#primitives" className={buttonClasses()}>
            Link primer
          </a>
          <a href="#primitives" className={buttonClasses({ variant: 'secondary' })}>
            Link sekunder
          </a>
        </div>
      </Panel>

      <Panel className="grid grid-cols-2 gap-4">
        <Field label="Nominal" htmlFor={id('amount')}>
          <MoneyInput id={id('amount')} value={amount} onValueChange={setAmount} />
        </Field>
        <Field label="Kategori" htmlFor={id('cat')}>
          <Select id={id('cat')} defaultValue="Makan & minum">
            <option>Makan &amp; minum</option>
            <option>Transportasi</option>
          </Select>
        </Field>
        <Field
          label="Nominal"
          htmlFor={id('empty')}
          error="Nominal belum diisi. Ketik jumlah uangnya dulu."
          errorId={id('empty-err')}
        >
          <MoneyInput
            id={id('empty')}
            value={empty}
            onValueChange={setEmpty}
            aria-invalid="true"
            aria-describedby={id('empty-err')}
          />
        </Field>
        <Field label="Cari catatan" htmlFor={id('q')}>
          <Input id={id('q')} placeholder="Misal: kopi" icon={<Search size={18} />} />
        </Field>
        <Field label="Nominal" htmlFor={id('big')} className="col-span-2">
          <MoneyInput id={id('big')} large value={25000} onValueChange={() => undefined} />
        </Field>
        <Field label="Tipe" labelAs="span" className="col-span-2">
          <Segmented<TxType>
            label="Tipe transaksi"
            value={type}
            onChange={setType}
            options={[
              { value: 'out', label: 'Pengeluaran' },
              { value: 'in', label: 'Pemasukan' },
              { value: 'tr', label: 'Transfer' },
            ]}
          />
        </Field>
        <Field label="Tampilan" labelAs="span" className="col-span-2">
          <Segmented<ThemeChoice>
            label="Tampilan"
            value={look}
            onChange={setLook}
            options={[
              { value: 'light', label: 'Terang', icon: <Sun size={18} aria-hidden="true" /> },
              { value: 'dark', label: 'Malam', icon: <Moon size={18} aria-hidden="true" /> },
              {
                value: 'system',
                label: 'Ikuti sistem',
                icon: <Monitor size={18} aria-hidden="true" />,
              },
            ]}
          />
        </Field>
        <div className="col-span-2 flex flex-wrap items-center gap-6">
          <Switch checked={on} onCheckedChange={setOn} aria-label="Email aktif" />
          <Switch checked={off} onCheckedChange={setOff} aria-label="Email mati" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Pengingat">
            <ToggleChip pressed={days.h3} onPressedChange={(v) => setDays({ ...days, h3: v })}>
              H-3
            </ToggleChip>
            <ToggleChip pressed={days.h1} onPressedChange={(v) => setDays({ ...days, h1: v })}>
              H-1
            </ToggleChip>
            <ToggleChip pressed={days.h0} onPressedChange={(v) => setDays({ ...days, h0: v })}>
              Hari H
            </ToggleChip>
          </div>
        </div>
      </Panel>

      <Panel className="flex flex-wrap gap-2.5">
        <Badge variant="due">Jatuh tempo H-1</Badge>
        <Badge variant="overdue">Terlambat 2 hari</Badge>
        <Badge variant="paid">Lunas</Badge>
        <Badge variant="waiting">Menunggu konfirmasi</Badge>
        <Badge variant="unpaid">Belum bayar</Badge>
        <span className="mt-1 flex w-full items-center gap-2">
          <Tag>Tagihan</Tag>
          <Tag>Patungan</Tag>
        </span>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => toast.show('Transaksi disimpan')}>
          Tampilkan toast
        </Button>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Buka sheet
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen} title="Catat transaksi">
        <div className="flex flex-col gap-4">
          <Field label="Catatan" htmlFor={id('note')}>
            <Input id={id('note')} placeholder="Misal: makan malam" />
          </Field>
          <Button full onClick={() => setOpen(false)}>
            Simpan transaksi
          </Button>
        </div>
      </Sheet>
    </section>
  );
}
