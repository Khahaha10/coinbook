'use client';

import {
  REMIND_DAY_OPTIONS,
  type CategoryDto,
  type MeDto,
  type UpdateMeInput,
} from '@coinbook/shared';
import { LogOut, Mail, Monitor, Moon, Pencil, Plus, Send, Sun } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Badge, Panel } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Segmented, Switch, ToggleChip } from '@/components/ui/controls';
import { Field, Input } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useSignOut } from '@/features/auth/hooks/use-auth';
import {
  CategorySheet,
  type CategorySheetState,
} from '@/features/categories/components/category-sheet';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useMe } from '@/features/me/hooks/use-me';
import { useTelegramLink } from '@/features/me/hooks/use-telegram-link';
import { useUpdateMe } from '@/features/me/hooks/use-update-me';
import { qk } from '@/lib/api/query-keys';
import { toShellUser } from '@/components/shell/shell-user';
import { DEFAULT_ERROR_MESSAGE } from '@/lib/api/errors';
import { applyTheme, readTheme, type Theme } from '@/lib/theme';

const H2 = 'text-h2 leading-[1.2] font-medium';
const ROW = 'flex min-h-11 items-center justify-between gap-3';
const REMIND_LABELS: Record<number, string> = { 3: 'H-3', 1: 'H-1', 0: 'Hari H' };
const THEME_OPTIONS = [
  { value: 'light', label: 'Terang', icon: <Sun size={18} aria-hidden="true" /> },
  { value: 'dark', label: 'Malam', icon: <Moon size={18} aria-hidden="true" /> },
  { value: 'system', label: 'Ikuti sistem', icon: <Monitor size={18} aria-hidden="true" /> },
] as const;

function IconCircle({ children, tone = 'desk' }: { children: ReactNode; tone?: 'desk' | 'tag' }) {
  return (
    <span className={tone === 'tag' ? 'av bg-tag-bg text-tag-text' : 'av bg-desk text-text'}>
      {children}
    </span>
  );
}

function ProfileSection({ me, save }: { me: MeDto; save: (patch: { name?: string }) => void }) {
  const [name, setName] = useState(me.name);
  return (
    <Panel as="section" aria-labelledby="st-prof">
      <h2 className={`mb-4 ${H2}`} id="st-prof">
        Profil
      </h2>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <span className="av size-16 text-xl" aria-hidden="true">
          {toShellUser(me.name).initials}
        </span>
        <Button variant="secondary" disabled>
          Ganti foto
        </Button>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @min-[400px]/cb:grid-cols-2">
        <Field label="Nama" htmlFor="st-n">
          <Input
            id="st-n"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const next = name.trim();
              if (next && next !== me.name) save({ name: next });
              else setName(me.name);
            }}
          />
        </Field>
        <Field
          label="Email"
          htmlFor="st-e"
          hint="Email dari akun Google, tidak bisa diubah di sini."
          hintId="st-e-h"
        >
          <Input id="st-e" value={me.email ?? ''} readOnly aria-describedby="st-e-h" />
        </Field>
      </div>
    </Panel>
  );
}

function CategoriesSection({
  categories,
  onOpen,
}: {
  categories: CategoryDto[];
  onOpen: (s: CategorySheetState) => void;
}) {
  return (
    <Panel as="section" aria-labelledby="st-cat">
      <div className={`mb-2 ${ROW}`}>
        <h2 className={H2} id="st-cat">
          Kategori
        </h2>
        <Button variant="quiet" onClick={() => onOpen({ mode: 'create' })}>
          <Plus size={20} aria-hidden="true" />
          Tambah kategori
        </Button>
      </div>
      <ul>
        {categories.map((c) => (
          <li key={c.id} className={`${ROW} border-t border-dashed border-rule py-1.5`}>
            <span className="flex items-center gap-3">
              <IconCircle tone={c.type === 'INCOME' ? 'tag' : 'desk'}>
                <CategoryIcon name={c.icon} size={18} aria-hidden="true" />
              </IconCircle>
              <span className="flex flex-col">
                <span className="font-medium">{c.name}</span>
                <span className="text-meta text-muted">
                  {c.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
              </span>
            </span>
            <Button
              variant="quiet"
              icon
              aria-label={`Ubah ${c.name}`}
              onClick={() => onOpen({ mode: 'edit', category: c })}
            >
              <Pencil size={20} aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const LINK_POLL_MS = 3000;

function useTelegramConnect(connected: boolean) {
  const link = useTelegramLink();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pending, setPending] = useState<{ code: string; expiresAt: number } | null>(null);

  useEffect(() => {
    if (!pending || connected) return;
    const timer = setInterval(() => {
      if (Date.now() > pending.expiresAt) setPending(null);
      else void queryClient.invalidateQueries({ queryKey: qk.me });
    }, LINK_POLL_MS);
    return () => clearInterval(timer);
  }, [pending, connected, queryClient]);

  const start = () => {
    const popup = window.open('', '_blank');
    link.mutate(undefined, {
      onSuccess: (dto) => {
        setPending({ code: dto.code, expiresAt: Date.parse(dto.expiresAt) });
        if (popup) {
          popup.opener = null;
          popup.location.href = dto.url;
        } else {
          window.location.assign(dto.url);
        }
      },
      onError: () => {
        popup?.close();
        toast.show(DEFAULT_ERROR_MESSAGE, 'error');
      },
    });
  };

  return { start, code: connected ? null : (pending?.code ?? null), busy: link.isPending };
}

function NotificationsSection({ me, save }: { me: MeDto; save: (patch: UpdateMeInput) => void }) {
  const telegram = useTelegramConnect(me.telegramConnected);
  const toggleDay = (day: number, on: boolean) => {
    const days = on
      ? [...me.defaultRemindDays, day]
      : me.defaultRemindDays.filter((d) => d !== day);
    save({ defaultRemindDays: REMIND_DAY_OPTIONS.filter((d) => days.includes(d)) });
  };
  return (
    <Panel as="section" aria-labelledby="st-not">
      <h2 className={`mb-2 ${H2}`} id="st-not">
        Notifikasi
      </h2>
      <div className={`${ROW} flex-wrap py-2`}>
        <span className="flex items-center gap-3">
          <IconCircle>
            <Send size={18} aria-hidden="true" />
          </IconCircle>
          <span className="flex flex-col">
            <span className="font-medium">Telegram</span>
            <span className="text-meta text-muted">
              {me.telegramConnected
                ? `Pengingat dikirim ke @${me.telegramUsername ?? ''}`
                : 'Belum terhubung. Kirim kode ke bot Coinbook.'}
            </span>
            {telegram.code ? (
              <span className="text-meta text-muted" role="status">
                Kode: <span className="font-medium tracking-wider text-text">{telegram.code}</span>
              </span>
            ) : null}
          </span>
        </span>
        {me.telegramConnected ? (
          <Badge variant="paid">Terhubung</Badge>
        ) : (
          <Button variant="secondary" onClick={telegram.start} disabled={telegram.busy}>
            Hubungkan Telegram
          </Button>
        )}
      </div>
      <div className={`${ROW} border-t border-dashed border-rule py-2`}>
        <span className="flex items-center gap-3">
          <IconCircle>
            <Mail size={18} aria-hidden="true" />
          </IconCircle>
          <span className="flex flex-col">
            <span className="font-medium" id="st-em">
              Email
            </span>
            <span className="text-meta text-muted">Pengingat tagihan ke {me.email ?? ''}</span>
          </span>
        </span>
        <Switch
          checked={me.emailReminders}
          aria-labelledby="st-em"
          onCheckedChange={(on) => save({ emailReminders: on })}
        />
      </div>
      <div className="flex flex-col gap-1.5 border-t border-dashed border-rule pt-3">
        <span className="text-[13px] font-medium">Pengingat bawaan untuk tagihan baru</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pengingat bawaan">
          {REMIND_DAY_OPTIONS.map((day) => (
            <ToggleChip
              key={day}
              pressed={me.defaultRemindDays.includes(day)}
              onPressedChange={(on) => toggleDay(day, on)}
            >
              {REMIND_LABELS[day]}
            </ToggleChip>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function BankSection({
  me,
  save,
}: {
  me: MeDto;
  save: (patch: { bankInfo: string | null }) => void;
}) {
  const [value, setValue] = useState(me.bankInfo ?? '');
  return (
    <Panel as="section" aria-labelledby="st-bank">
      <h2 className={`mb-3 ${H2}`} id="st-bank">
        Info rekening
      </h2>
      <Field
        label="Rekening untuk teks patungan"
        htmlFor="st-acc"
        hint={
          value.trim()
            ? `Muncul sebagai “Transfer ke ${value.trim()}” di link dan teks WhatsApp.`
            : undefined
        }
        hintId="st-acc-h"
      >
        <Input
          id="st-acc"
          value={value}
          maxLength={120}
          aria-describedby={value.trim() ? 'st-acc-h' : undefined}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const next = value.trim() || null;
            if (next !== me.bankInfo) save({ bankInfo: next });
          }}
        />
      </Field>
    </Panel>
  );
}

function subscribeStorage(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function ThemeSection() {
  const stored = useSyncExternalStore(subscribeStorage, readTheme, () => 'system' as const);
  const [chosen, setChosen] = useState<Theme | null>(null);
  const theme = chosen ?? stored;
  return (
    <Panel as="section" aria-labelledby="st-look">
      <h2 className={`mb-3 ${H2}`} id="st-look">
        Tampilan
      </h2>
      <Segmented
        labelledBy="st-look"
        options={THEME_OPTIONS}
        value={theme}
        onChange={(t) => {
          setChosen(t);
          applyTheme(t);
        }}
      />
    </Panel>
  );
}

export function SettingsPage() {
  const me = useMe();
  const categories = useCategories();
  const update = useUpdateMe();
  const signOut = useSignOut();
  const toast = useToast();
  const [sheet, setSheet] = useState<CategorySheetState>({ mode: 'closed' });
  const save = (patch: UpdateMeInput) =>
    update.mutate(patch, { onError: () => toast.show(DEFAULT_ERROR_MESSAGE, 'error') });

  return (
    <>
      <header className="ph">
        <h1 className="text-h1 leading-[1.2] font-medium tracking-[-0.01em]">Pengaturan</h1>
      </header>
      {me.data && categories.data ? (
        <div className="flex max-w-[760px] flex-col gap-6">
          <ProfileSection key={me.data.id} me={me.data} save={save} />
          <CategoriesSection categories={categories.data} onOpen={setSheet} />
          <NotificationsSection me={me.data} save={save} />
          <BankSection key={`bank-${me.data.id}`} me={me.data} save={save} />
          <ThemeSection />
          <div>
            <Button
              variant="secondary"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              <LogOut size={20} aria-hidden="true" />
              Keluar
            </Button>
          </div>
        </div>
      ) : (
        <Panel className="h-64 max-w-[760px]" aria-busy="true" />
      )}
      <CategorySheet state={sheet} onClose={() => setSheet({ mode: 'closed' })} />
    </>
  );
}
