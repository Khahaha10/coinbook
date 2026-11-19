import type { ListTransactionsQuery } from '@coinbook/shared';

export type LedgerFilters = Omit<ListTransactionsQuery, 'page' | 'pageSize'>;

export const qk = {
  me: ['me'] as const,
  wallets: { all: ['wallets'] as const },
  categories: { all: ['categories'] as const },
  bills: {
    all: ['bills'] as const,
    list: ['bills', 'list'] as const,
    calendar: (month: string) => ['bills', 'calendar', month] as const,
    payments: (id: string) => ['bills', 'payments', id] as const,
  },
  splits: {
    all: ['splits'] as const,
    list: ['splits', 'list'] as const,
    detail: (id: string) => ['splits', 'detail', id] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    recent: (limit: number) => ['transactions', 'recent', limit] as const,
    ledger: (filters: LedgerFilters) => ['transactions', 'ledger', filters] as const,
  },
  reports: {
    all: ['reports'] as const,
    dashboard: ['reports', 'dashboard'] as const,
    summary: (month: string) => ['reports', 'summary', month] as const,
  },
};
