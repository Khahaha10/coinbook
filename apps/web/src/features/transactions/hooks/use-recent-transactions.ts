import type { TransactionDto } from '@coinbook/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: qk.transactions.recent(limit),
    queryFn: () => api<TransactionDto[]>('/transactions/recent', { query: { limit } }),
  });
}
