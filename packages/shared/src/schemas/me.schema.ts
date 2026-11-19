import { z } from 'zod';
import { idSchema, nameSchema } from './common';

export const REMIND_DAY_OPTIONS = [3, 1, 0] as const;

export const remindDaysSchema = z
  .array(z.union([z.literal(3), z.literal(1), z.literal(0)]))
  .max(3)
  .refine((days) => new Set(days).size === days.length, 'Duplicate reminder day');

export const updateMeSchema = z
  .object({
    name: nameSchema,
    bankInfo: z.string().trim().max(120).nullable(),
    emailReminders: z.boolean(),
    defaultRemindDays: remindDaysSchema,
  })
  .partial()
  .strict();
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export const meSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bankInfo: z.string().nullable(),
  emailReminders: z.boolean(),
  defaultRemindDays: z.array(z.number().int()),
  isDemo: z.boolean(),
  telegramConnected: z.boolean(),
  telegramUsername: z.string().nullable(),
});
export type MeDto = z.infer<typeof meSchema>;

export const bootstrapQuerySchema = z.object({
  demo: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});
export type BootstrapQuery = z.infer<typeof bootstrapQuerySchema>;

export interface TelegramLinkDto {
  code: string;
  url: string;
  expiresAt: string;
}
