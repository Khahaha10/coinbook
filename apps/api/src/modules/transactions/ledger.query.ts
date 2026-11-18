import { Prisma } from '@prisma/client';
import type { ListTransactionsQuery } from '@coinbook/shared';

export interface LedgerRow {
  id: string;
  balance_after: number;
}

type LedgerFilters = Omit<ListTransactionsQuery, 'page' | 'pageSize'>;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function ledgerFilterSql(f: LedgerFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (f.from) parts.push(Prisma.sql`date >= ${f.from}::date`);
  if (f.to) parts.push(Prisma.sql`date <= ${f.to}::date`);
  if (f.walletId) {
    parts.push(
      Prisma.sql`("walletId" = ${f.walletId}::uuid OR "toWalletId" = ${f.walletId}::uuid)`,
    );
  }
  if (f.categoryId) parts.push(Prisma.sql`"categoryId" = ${f.categoryId}::uuid`);
  if (f.type) parts.push(Prisma.sql`type = ${f.type}::"TransactionType"`);
  if (f.q) {
    const like = `%${escapeLike(f.q)}%`;
    parts.push(Prisma.sql`(description ILIKE ${like} OR COALESCE(note, '') ILIKE ${like})`);
  }
  return Prisma.join(parts, ' AND ');
}

export function ledgerSql(
  userId: string,
  currentTotal: number,
  filters: Prisma.Sql,
  limit: number,
  offset: number,
): Prisma.Sql {
  return Prisma.sql`
    WITH ordered AS (
      SELECT t.id, t.date, t."createdAt", t."walletId", t."toWalletId", t."categoryId",
             t.type, t.description, t.note,
             CASE t.type WHEN 'INCOME' THEN t.amount WHEN 'EXPENSE' THEN -t.amount ELSE 0 END AS signed
      FROM "Transaction" t
      WHERE t."userId" = ${userId}::uuid
    ),
    ranked AS (
      SELECT *, COALESCE(SUM(signed) OVER (
        ORDER BY date DESC, "createdAt" DESC, id DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ), 0) AS newer_sum
      FROM ordered
    )
    SELECT id, (${currentTotal}::bigint - newer_sum)::int AS balance_after
    FROM ranked
    WHERE ${filters}
    ORDER BY date DESC, "createdAt" DESC, id DESC
    LIMIT ${limit} OFFSET ${offset}`;
}

export function ledgerCountSql(userId: string, filters: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`
    SELECT COUNT(*)::int AS count FROM "Transaction"
    WHERE "userId" = ${userId}::uuid AND ${filters}`;
}
