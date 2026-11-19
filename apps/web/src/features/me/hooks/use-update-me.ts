import type { MeDto, UpdateMeInput } from '@coinbook/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeInput) => api<MeDto>('/me', { method: 'PATCH', body: input }),
    onSuccess: (me) => queryClient.setQueryData(qk.me, me),
  });
}
