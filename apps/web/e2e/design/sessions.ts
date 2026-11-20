import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import type { Browser, BrowserContext } from '@playwright/test';
import { CONTEXT_OPTIONS } from '../fixtures';

const COOKIE_CHUNK = 3180;

function publicEnv(): { url: string; key: string } {
  const env: Record<string, string | undefined> = parseEnv(
    readFileSync(join(__dirname, '..', '..', '.env.local'), 'utf8'),
  );
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('apps/web/.env.local needs the NEXT_PUBLIC_SUPABASE_* values.');
  return { url, key };
}

export async function emptyAccountContext(browser: Browser): Promise<BrowserContext> {
  const { url, key } = publicEnv();
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`Anonymous sign-in failed: ${res.status}`);
  const session: unknown = await res.json();
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
  const name = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
  const chunks = value.match(new RegExp(`.{1,${COOKIE_CHUNK}}`, 'g')) ?? [];
  const context = await browser.newContext(CONTEXT_OPTIONS);
  await context.addCookies(
    chunks.map((chunk, i) => ({
      name: chunks.length === 1 ? name : `${name}.${i}`,
      value: chunk,
      url: CONTEXT_OPTIONS.baseURL,
      sameSite: 'Lax' as const,
    })),
  );
  return context;
}
