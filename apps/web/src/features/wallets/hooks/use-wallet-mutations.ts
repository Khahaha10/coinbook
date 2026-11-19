import type {
  CreateWalletInput,
  TransferInput,
  TransferResultDto,
  UpdateWalletInput,
  WalletDto,
} from '@coinbook/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

function invalidateWallets(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: qk.wallets.all }),
    queryClient.invalidateQueries({ queryKey: qk.transactions.all }),
    queryClient.invalidateQueries({ queryKey: qk.reports.all }),
  ]);
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWalletInput) => api<WalletDto>('/wallets', { method: 'POST', body: input }),
    onSuccess: () => invalidateWallets(queryClient),
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWalletInput }) =>
      api<WalletDto>(`/wallets/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => invalidateWallets(queryClient),
  });
}

export function useArchiveWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<WalletDto>(`/wallets/${id}/archive`, { method: 'POST' }),
    onSuccess: () => invalidateWallets(queryClient),
  });
}

export function useTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferInput) =>
      api<TransferResultDto>('/wallets/transfer', { method: 'POST', body: input }),
    onSuccess: () => invalidateWallets(queryClient),
  });
}
