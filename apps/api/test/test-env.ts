import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

export const API_DIR = join(__dirname, '..');

const REQUIRED = [
  'DATABASE_URL',
  'DIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_JWT_SECRET',
  'CRON_SECRET',
  'PORT',
] as const;
const NOTIFICATION_KEYS = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_BOT_USERNAME',
  'TELEGRAM_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'SUPABASE_SERVICE_ROLE_KEY',
];

type EnvMap = Record<string, string>;
type TestEnv = EnvMap & Record<(typeof REQUIRED)[number], string>;

function readEnvFile(file: string): EnvMap {
  const parsed: Record<string, string | undefined> = parseEnv(readFileSync(file, 'utf8'));
  return Object.fromEntries(
    Object.entries(parsed).filter((e): e is [string, string] => e[1] !== undefined),
  );
}

function dbUser(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).username || null;
  } catch {
    return null;
  }
}

function assertNotDev(test: EnvMap): void {
  const devFile = join(API_DIR, '.env');
  if (!existsSync(devFile)) return;
  const dev = readEnvFile(devFile);
  const devUsers = [dbUser(dev.DATABASE_URL), dbUser(dev.DIRECT_URL)].filter(Boolean);
  const testUsers = [dbUser(test.DATABASE_URL), dbUser(test.DIRECT_URL)];
  const sameDb = testUsers.some((u) => u !== null && devUsers.includes(u));
  const sameProject = Boolean(dev.SUPABASE_URL) && dev.SUPABASE_URL === test.SUPABASE_URL;
  if (sameDb || sameProject) {
    throw new Error('apps/api/.env.test points at the dev Supabase project. Use the test project.');
  }
}

let cached: TestEnv | undefined;

export function testEnv(): TestEnv {
  if (cached) return cached;
  const file = join(API_DIR, '.env.test');
  if (!existsSync(file)) throw new Error('apps/api/.env.test is missing.');
  const env = readEnvFile(file);
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length > 0) throw new Error(`Fill ${missing.join(', ')} in apps/api/.env.test.`);
  if (env.NODE_ENV !== 'test') throw new Error('apps/api/.env.test must set NODE_ENV=test.');
  assertNotDev(env);
  cached = env as TestEnv;
  return cached;
}

export function serverEnv(): NodeJS.ProcessEnv {
  const inherited: NodeJS.ProcessEnv = { ...process.env };
  const test: EnvMap = { ...testEnv() };
  for (const key of NOTIFICATION_KEYS) {
    delete inherited[key];
    delete test[key];
  }
  return { ...inherited, ...test };
}

export function apiBaseUrl(): string {
  return `http://localhost:${testEnv().PORT}/api/v1`;
}
