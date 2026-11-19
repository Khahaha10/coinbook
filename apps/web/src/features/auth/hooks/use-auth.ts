import type { MeDto } from '@coinbook/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { createClient } from '@/lib/supabase/browser';

export function useStartDemo() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await createClient().auth.signInAnonymously();
      if (error) throw error;
      return api<MeDto>('/me/bootstrap', { method: 'POST', query: { demo: true } });
    },
    onSuccess: (me) => {
      queryClient.clear();
      queryClient.setQueryData(qk.me, me);
      router.push('/dashboard');
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      await createClient().auth.signOut();
    },
    onSuccess: () => window.location.assign('/'),
  });
}
