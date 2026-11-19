'use client';

import {
  BookText,
  CalendarDays,
  ChartNoAxesColumn,
  Ellipsis,
  House,
  Plus,
  Receipt,
  SlidersHorizontal,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CoinMark, Wordmark } from '@/components/coinbook/coin-mark';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SIDE_NAV: readonly NavItem[] = [
  { href: '/dashboard', label: 'Beranda', icon: House },
  { href: '/transactions', label: 'Transaksi', icon: BookText },
  { href: '/wallets', label: 'Dompet', icon: Wallet },
  { href: '/bills', label: 'Tagihan', icon: CalendarDays },
  { href: '/splits', label: 'Patungan', icon: Receipt },
  { href: '/reports', label: 'Laporan', icon: ChartNoAxesColumn },
  { href: '/settings', label: 'Pengaturan', icon: SlidersHorizontal },
];

const BOTTOM_NAV: readonly (NavItem & { match: readonly string[] })[] = [
  { href: '/dashboard', label: 'Beranda', icon: House, match: ['/dashboard'] },
  { href: '/transactions', label: 'Transaksi', icon: BookText, match: ['/transactions'] },
  { href: '/bills', label: 'Tagihan', icon: CalendarDays, match: ['/bills'] },
  { href: '/splits', label: 'Patungan', icon: Receipt, match: ['/splits'] },
  {
    href: '/settings',
    label: 'Lainnya',
    icon: Ellipsis,
    match: ['/settings', '/wallets', '/reports'],
  },
];

function isActive(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export interface ShellUser {
  name: string;
  initials: string;
}

export interface AppShellProps {
  user: ShellUser;
  onAddTransaction: () => void;
  hideBottomNav?: boolean;
  activePath?: string;
  children: ReactNode;
}

export function AppShell({
  user,
  onAddTransaction,
  hideBottomNav = false,
  activePath,
  children,
}: AppShellProps) {
  const currentPath = usePathname();
  const pathname = activePath ?? currentPath;
  return (
    <div className="shell">
      <aside className="side" aria-label="Navigasi utama">
        <Link className="brand" href="/dashboard">
          <CoinMark />
          <span className="wm">Coinbook</span>
        </Link>
        <button
          type="button"
          className={buttonClasses({
            className:
              'add @min-[768px]/cb:size-12 @min-[768px]/cb:px-0 @min-[1024px]/cb:h-11 @min-[1024px]/cb:w-full',
          })}
          onClick={onAddTransaction}
        >
          <Plus size={20} aria-hidden="true" />
          <span className="lbl">Catat transaksi</span>
        </button>
        <nav className="nav">
          {SIDE_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, [href]);
            return (
              <Link
                key={href}
                href={href}
                className={cn('nv', active && 'on')}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="lbl">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="who">
          <span className="av" aria-hidden="true">
            {user.initials}
          </span>
          <span className="who-t flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-meta text-muted">Akun pribadi</span>
          </span>
        </div>
      </aside>

      <main className="main">
        <div className="wrap">{children}</div>
        {hideBottomNav ? null : (
          <nav className="bnav" aria-label="Navigasi bawah">
            <button
              type="button"
              className="fab"
              aria-label="Catat transaksi"
              onClick={onAddTransaction}
            >
              <Plus size={24} aria-hidden="true" />
            </button>
            {BOTTOM_NAV.map(({ href, label, icon: Icon, match }) => {
              const active = isActive(pathname, match);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(active && 'on')}
                  aria-current={isActive(pathname, [href]) ? 'page' : undefined}
                >
                  <Icon size={20} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </main>
    </div>
  );
}

export function MobileTopBar({ user }: { user: ShellUser }) {
  return (
    <div className="mtop">
      <Wordmark />
      <Link href="/settings" className="av size-11" aria-label="Profil dan pengaturan">
        {user.initials}
      </Link>
    </div>
  );
}
