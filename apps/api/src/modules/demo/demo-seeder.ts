import { randomUUID } from 'node:crypto';
import type { Prisma, Profile } from '@prisma/client';
import {
  addDays,
  calculateSplit,
  DEFAULT_CATEGORIES,
  DEMO_BILLS,
  DEMO_PROFILE,
  DEMO_SPLITS,
  DEMO_TODAY,
  DEMO_TRANSACTIONS,
  DEMO_WALLETS,
  diffDays,
  fromDateOnly,
  type DateOnly,
  type FixtureTransaction,
} from '@coinbook/shared';
import { generateShareToken } from '../../common/share-token';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOON_JAKARTA_UTC_MS = 5 * 60 * 60 * 1000;

export interface SeedDemoOptions {
  userId: string;
  today: DateOnly;
  useFixedShareTokens: boolean;
}

function netForWallet(walletKey: string): number {
  return DEMO_TRANSACTIONS.reduce((sum, t) => {
    if (t.walletKey === walletKey) return sum + (t.type === 'INCOME' ? t.amount : -t.amount);
    if (t.toWalletKey === walletKey) return sum + t.amount;
    return sum;
  }, 0);
}

function idMap(keys: readonly string[]): Map<string, string> {
  return new Map(keys.map((k) => [k, randomUUID()]));
}

function must(map: Map<string, string>, key: string | undefined): string {
  const id = key === undefined ? undefined : map.get(key);
  if (!id) throw new Error(`Demo fixture references unknown key: ${String(key)}`);
  return id;
}

export async function seedDemo(
  tx: Prisma.TransactionClient,
  opts: SeedDemoOptions,
): Promise<Profile> {
  const { userId, today, useFixedShareTokens } = opts;
  const shift = diffDays(DEMO_TODAY, today);
  const day = (d: DateOnly): Date => fromDateOnly(addDays(d, shift));
  const stamp = (iso: string): Date => new Date(new Date(iso).getTime() + shift * DAY_MS);

  const profile = await tx.profile.create({
    data: { id: userId, ...DEMO_PROFILE, isDemo: true },
  });

  const categoryIds = idMap(DEFAULT_CATEGORIES.map((c) => c.key));
  await tx.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      id: must(categoryIds, c.key),
      userId,
      name: c.name,
      type: c.type,
      icon: c.icon,
      isDefault: true,
    })),
  });

  const walletIds = idMap(DEMO_WALLETS.map((w) => w.key));
  await tx.wallet.createMany({
    data: DEMO_WALLETS.map((w, i) => ({
      id: must(walletIds, w.key),
      userId,
      name: w.name,
      type: w.type,
      balance: w.balance,
      openingBalance: w.balance - netForWallet(w.key),
      sortOrder: i,
    })),
  });

  const txIds = idMap(DEMO_TRANSACTIONS.map((t) => t.key));
  const txCreatedAt = new Map<string, Date>();
  await tx.transaction.createMany({
    data: DEMO_TRANSACTIONS.map((t: FixtureTransaction, i) => {
      const createdAt = new Date(day(t.date).getTime() + NOON_JAKARTA_UTC_MS + i * 1000);
      txCreatedAt.set(t.key, createdAt);
      return {
        id: must(txIds, t.key),
        userId,
        type: t.type,
        amount: t.amount,
        walletId: must(walletIds, t.walletKey),
        toWalletId: t.toWalletKey ? must(walletIds, t.toWalletKey) : null,
        categoryId: t.categoryKey ? must(categoryIds, t.categoryKey) : null,
        date: day(t.date),
        description: t.description,
        note: t.note,
        source: t.source,
        createdAt,
      };
    }),
  });

  const billIds = idMap(DEMO_BILLS.map((b) => b.key));
  await tx.bill.createMany({
    data: DEMO_BILLS.map((b) => ({
      id: must(billIds, b.key),
      userId,
      name: b.name,
      amount: b.amount,
      cycle: b.cycle,
      anchorDay: Number(addDays(b.nextDueDate, shift).slice(8, 10)),
      nextDueDate: day(b.nextDueDate),
      walletId: must(walletIds, b.walletKey),
      categoryId: must(categoryIds, b.categoryKey),
      remindDays: b.remindDays,
    })),
  });
  await tx.billPayment.createMany({
    data: DEMO_BILLS.flatMap((b) =>
      b.payments.map((p) => ({
        billId: must(billIds, b.key),
        transactionId: must(txIds, p.transactionKey),
        dueDate: day(p.dueDate),
        paidAt: txCreatedAt.get(p.transactionKey) ?? day(p.dueDate),
      })),
    ),
  });

  for (const s of DEMO_SPLITS) {
    const calc = calculateSplit({
      people: s.people,
      items: s.items,
      taxBps: s.taxBps,
      serviceBps: s.serviceBps,
      discountType: s.discountType,
      discountValue: s.discountValue,
    });
    const fixed = useFixedShareTokens && s.shareToken ? s.shareToken : null;
    const taken = fixed ? await tx.split.findUnique({ where: { shareToken: fixed } }) : null;
    const splitId = randomUUID();
    await tx.split.create({
      data: {
        id: splitId,
        userId,
        title: s.title,
        date: day(s.date),
        walletId: must(walletIds, s.walletKey),
        taxBps: s.taxBps,
        serviceBps: s.serviceBps,
        discountType: s.discountType,
        discountValue: s.discountValue,
        subtotal: calc.subtotal,
        grandTotal: calc.grandTotal,
        shareToken: fixed && !taken ? fixed : generateShareToken(),
        expenseTransactionId: null,
      },
    });

    const personIds = idMap(s.people.map((p) => p.key));
    const shares = new Map(calc.people.map((p) => [p.key, p.share]));
    await tx.splitPerson.createMany({
      data: s.people.map((p, i) => ({
        id: must(personIds, p.key),
        splitId,
        name: p.name,
        isOwner: p.isOwner,
        share: shares.get(p.key) ?? 0,
        sortOrder: i,
      })),
    });

    const items = s.items.map((it, i) => ({ ...it, id: randomUUID(), sortOrder: i }));
    await tx.splitItem.createMany({
      data: items.map(({ id, name, price, qty, sortOrder }) => ({
        id,
        splitId,
        name,
        price,
        qty,
        sortOrder,
      })),
    });
    await tx.splitAssignment.createMany({
      data: items.flatMap((it) =>
        [...new Set(it.personKeys)].map((k) => ({ itemId: it.id, personId: must(personIds, k) })),
      ),
    });

    await tx.debt.createMany({
      data: s.people
        .filter((p) => !p.isOwner)
        .map((p) => {
          const debt = s.debts[p.key];
          return {
            personId: must(personIds, p.key),
            amount: shares.get(p.key) ?? 0,
            status: debt?.status ?? 'UNPAID',
            markedPaidAt: debt?.markedPaidAt ? stamp(debt.markedPaidAt) : null,
            confirmedAt: debt?.confirmedAt ? stamp(debt.confirmedAt) : null,
            walletId: debt?.walletKey ? must(walletIds, debt.walletKey) : null,
            transactionId: debt?.transactionKey ? must(txIds, debt.transactionKey) : null,
          };
        }),
    });
  }

  return profile;
}
