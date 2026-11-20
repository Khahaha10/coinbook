import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { API_DIR, apiBaseUrl, serverEnv, testEnv } from './test-env';

const HEALTH_TIMEOUT_MS = 60_000;
const POLL_MS = 500;

declare global {
  var __COINBOOK_API__: ChildProcess | undefined;
}

function migrate(): void {
  const env = testEnv();
  execFileSync(
    process.execPath,
    [join(API_DIR, 'node_modules', 'prisma', 'build', 'index.js'), 'migrate', 'deploy'],
    {
      cwd: API_DIR,
      env: { ...process.env, DATABASE_URL: env.DATABASE_URL, DIRECT_URL: env.DIRECT_URL },
      stdio: 'inherit',
    },
  );
}

async function resetDatabase(): Promise<void> {
  const prisma = new PrismaClient({ datasourceUrl: testEnv().DIRECT_URL });
  try {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    if (tables.length > 0) {
      const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE ${list} CASCADE`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

function startServer(): ChildProcess {
  const main = join(API_DIR, 'dist', 'main.js');
  if (!existsSync(main)) throw new Error('apps/api/dist is missing. Run the api build first.');
  const child = spawn(process.execPath, [main], {
    cwd: __dirname,
    env: serverEnv(),
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  return child;
}

async function waitForHealth(child: ChildProcess): Promise<void> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`API exited early with code ${child.exitCode}.`);
    try {
      const res = await fetch(`${apiBaseUrl()}/health`);
      if (res.ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, POLL_MS));
      continue;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error('API did not become healthy in time.');
}

export default async function globalSetup(): Promise<void> {
  testEnv();
  migrate();
  await resetDatabase();
  const child = startServer();
  globalThis.__COINBOOK_API__ = child;
  try {
    await waitForHealth(child);
  } catch (e) {
    child.kill();
    throw e;
  }
}
