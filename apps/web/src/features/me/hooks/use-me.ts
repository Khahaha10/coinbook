import type { MeDto } from '@coinbook/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api<MeDto>('/me/bootstrap', { method: 'POST' }),
    staleTime: Infinity,
  });
}
