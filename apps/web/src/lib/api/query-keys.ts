export const qk = {
  me: ['me'] as const,
  wallets: { all: ['wallets'] as const },
  transactions: {
    all: ['transactions'] as const,
    recent: (limit: number) => ['transactions', 'recent', limit] as const,
  },
  reports: {
    all: ['reports'] as const,
    dashboard: ['reports', 'dashboard'] as const,
  },
};
