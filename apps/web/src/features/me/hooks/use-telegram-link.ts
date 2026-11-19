import type { TelegramLinkDto } from '@coinbook/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useTelegramLink() {
  return useMutation({
    mutationFn: () => api<TelegramLinkDto>('/me/telegram/link', { method: 'POST' }),
  });
}
