import { existsSync } from 'node:fs';
import { z } from 'zod';
import { dateOnlySchema } from '@coinbook/shared';

const optional = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_JWT_SECRET: optional,
  SUPABASE_SERVICE_ROLE_KEY: optional,
  APP_URL: z.url(),
  CORS_ORIGIN: z.url(),
  CRON_SECRET: z.string().min(32),
  TELEGRAM_BOT_TOKEN: optional,
  TELEGRAM_BOT_USERNAME: optional,
  TELEGRAM_WEBHOOK_SECRET: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,
  ENABLE_SWAGGER: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  COINBOOK_FIXED_TODAY: optional.pipe(dateOnlySchema.optional()),
});

export type Env = z.infer<typeof envSchema>;

export const ENV = Symbol('ENV');

let cached: Env | undefined;

export function loadEnv(): Env {
  if (cached) return cached;
  if (existsSync('.env')) process.loadEnvFile('.env');
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid api env. ${problems}. Copy apps/api/.env.example to apps/api/.env.`);
  }
  cached = parsed.data;
  return cached;
}
