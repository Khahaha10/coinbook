import { loadEnv } from '../config/env';

async function main(): Promise<void> {
  const base = process.argv[2];
  if (!base) throw new Error('Usage: pnpm --filter api telegram:set-webhook <public API base URL>');
  const env = loadEnv();
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET must be set');
  }
  const url = `${base.replace(/\/$/, '')}/api/v1/internal/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }),
  });
  const body = (await res.json()) as { ok: boolean; description?: string };
  if (!body.ok) throw new Error(`setWebhook failed: ${body.description ?? res.status}`);
  process.stdout.write(`Webhook set to ${url}\n`);
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
