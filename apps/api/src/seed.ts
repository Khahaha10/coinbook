import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { businessToday } from './common/clock';
import { loadEnv } from './config/env';
import { deleteUserData } from './database/delete-user-data';
import { findBalanceMismatches } from './database/wallet-balance';
import { seedDemo } from './modules/demo/demo-seeder';

const SEED_TIMEOUT_MS = 30_000;

async function main(): Promise<void> {
  const logger = new Logger('seed');
  const env = loadEnv();
  const userId = z.uuid().safeParse(process.env.SEED_USER_ID);
  if (!userId.success) {
    throw new Error('Set SEED_USER_ID to the Supabase auth user id that should own the demo data.');
  }
  const today = businessToday(env);
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(
      async (tx) => {
        await deleteUserData(tx, userId.data);
        await seedDemo(tx, {
          userId: userId.data,
          today,
          useFixedShareTokens: env.COINBOOK_FIXED_TODAY !== undefined,
        });
      },
      { timeout: SEED_TIMEOUT_MS },
    );
    const mismatches = await findBalanceMismatches(prisma, userId.data);
    if (mismatches.length > 0) throw new Error(`Balance mismatch: ${JSON.stringify(mismatches)}`);
    logger.log(`Demo data seeded for ${userId.data} (today = ${today})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e: unknown) => {
  new Logger('seed').error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
