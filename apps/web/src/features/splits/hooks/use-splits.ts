import type { CreateSplitInput, SplitDetailDto } from '@coinbook/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useSplit(id: string) {
  return useQuery({ queryKey: qk.splits.detail(id), queryFn: () => api<SplitDetailDto>(`/splits/${id}`) });
}

export function useConfirmDebt(splitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (personId: string) =>
      api<SplitDetailDto>(`/splits/${splitId}/people/${personId}/confirm`, { method: 'POST', body: {} }),
    onSuccess: (detail) => {
      queryClient.setQueryData(qk.splits.detail(splitId), detail);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.splits.all }),
        queryClient.invalidateQueries({ queryKey: qk.transactions.all }),
        queryClient.invalidateQueries({ queryKey: qk.wallets.all }),
        queryClient.invalidateQueries({ queryKey: qk.reports.all }),
      ]);
    },
  });
}

export function useCreateSplit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSplitInput) =>
      api<SplitDetailDto>('/splits', { method: 'POST', body: input }),
    onSuccess: (detail) => {
      queryClient.setQueryData(qk.splits.detail(detail.id), detail);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.splits.list }),
        queryClient.invalidateQueries({ queryKey: qk.transactions.all }),
        queryClient.invalidateQueries({ queryKey: qk.wallets.all }),
        queryClient.invalidateQueries({ queryKey: qk.reports.all }),
      ]);
    },
  });
}
