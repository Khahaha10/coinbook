import type { WalletListDto } from '@coinbook/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useWallets() {
  return useQuery({ queryKey: qk.wallets.all, queryFn: () => api<WalletListDto>('/wallets') });
}
