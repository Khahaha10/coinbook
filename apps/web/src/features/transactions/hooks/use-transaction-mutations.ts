import type { CreateTransactionInput, TransactionDto, UpdateTransactionInput } from '@coinbook/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

function invalidateMoney(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: qk.transactions.all }),
    queryClient.invalidateQueries({ queryKey: qk.wallets.all }),
    queryClient.invalidateQueries({ queryKey: qk.reports.all }),
  ]);
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      api<TransactionDto>('/transactions', { method: 'POST', body: input }),
    onSuccess: () => invalidateMoney(queryClient),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      api<TransactionDto>(`/transactions/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => invalidateMoney(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/transactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateMoney(queryClient),
  });
}
