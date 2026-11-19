import type { Paginated, TransactionDto } from '@coinbook/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk, type LedgerFilters } from '@/lib/api/query-keys';

export const LEDGER_PAGE_SIZE = 13;

export function useLedger(filters: LedgerFilters) {
  return useInfiniteQuery({
    queryKey: qk.transactions.ledger(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api<Paginated<TransactionDto>>('/transactions', {
        query: { ...filters, page: pageParam, pageSize: LEDGER_PAGE_SIZE },
      }),
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}
