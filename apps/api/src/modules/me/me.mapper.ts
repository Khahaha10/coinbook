import type { Profile } from '@prisma/client';
import type { MeDto } from '@coinbook/shared';

export function toMeDto(p: Profile): MeDto {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    avatarUrl: p.avatarUrl,
    bankInfo: p.bankInfo,
    emailReminders: p.emailReminders,
    defaultRemindDays: p.defaultRemindDays,
    isDemo: p.isDemo,
    telegramConnected: p.telegramChatId !== null,
    telegramUsername: p.telegramUsername,
  };
}
