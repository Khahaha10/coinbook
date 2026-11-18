import { Prisma } from '@prisma/client';

type Db = Pick<Prisma.TransactionClient, '$executeRaw' | '$queryRaw'>;

export interface BalanceMismatch {
  id: string;
  name: string;
  balance: number;
  expected: number;
}

function expectedBalanceSql(userId: string): Prisma.Sql {
  return Prisma.sql`w."openingBalance" + COALESCE((
    SELECT SUM(CASE
      WHEN t."walletId" = w.id AND t.type = 'INCOME' THEN t.amount
      WHEN t."walletId" = w.id THEN -t.amount
      WHEN t."toWalletId" = w.id THEN t.amount
      ELSE 0 END)
    FROM "Transaction" t
    WHERE t."userId" = ${userId}::uuid AND (t."walletId" = w.id OR t."toWalletId" = w.id)
  ), 0)`;
}

export async function recalculateWalletBalances(db: Db, userId: string): Promise<void> {
  await db.$executeRaw`
    UPDATE "Wallet" w SET balance = ${expectedBalanceSql(userId)}
    WHERE w."userId" = ${userId}::uuid`;
}

export function findBalanceMismatches(db: Db, userId: string): Promise<BalanceMismatch[]> {
  return db.$queryRaw<BalanceMismatch[]>`
    SELECT id, name, balance, expected::int AS expected FROM (
      SELECT w.id, w.name, w.balance, ${expectedBalanceSql(userId)} AS expected
      FROM "Wallet" w WHERE w."userId" = ${userId}::uuid
    ) x WHERE balance <> expected`;
}
