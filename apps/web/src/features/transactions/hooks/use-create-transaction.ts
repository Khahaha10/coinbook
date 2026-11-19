import type { CreateTransactionInput, TransactionDto } from '@coinbook/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      api<TransactionDto>('/transactions', { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.transactions.all }),
        queryClient.invalidateQueries({ queryKey: qk.wallets.all }),
        queryClient.invalidateQueries({ queryKey: qk.reports.all }),
      ]),
  });
}
