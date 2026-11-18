import { Prisma } from '@prisma/client';
import {
  calculateSplit,
  toDateOnly,
  type SplitDetailDto,
  type SplitStatus,
} from '@coinbook/shared';

export const splitDetailInclude = {
  wallet: { select: { id: true, name: true } },
  items: { orderBy: { sortOrder: 'asc' }, include: { assignments: true } },
  people: {
    orderBy: { sortOrder: 'asc' },
    include: { debt: { include: { wallet: { select: { id: true, name: true } } } } },
  },
} satisfies Prisma.SplitInclude;

export type SplitWithDetail = Prisma.SplitGetPayload<{ include: typeof splitDetailInclude }>;

interface DebtLike {
  amount: number;
  status: string;
}

export function debtTotals(debts: DebtLike[]): {
  paidCount: number;
  peopleCount: number;
  status: SplitStatus;
  receivedTotal: number;
  outstandingTotal: number;
} {
  const paid = debts.filter((d) => d.status === 'PAID');
  const open = debts.filter((d) => d.status !== 'PAID');
  return {
    paidCount: paid.length,
    peopleCount: debts.length,
    status: open.length === 0 ? 'PAID' : 'UNPAID',
    receivedTotal: paid.reduce((s, d) => s + d.amount, 0),
    outstandingTotal: open.reduce((s, d) => s + d.amount, 0),
  };
}

export function toSplitDetailDto(s: SplitWithDetail, appUrl: string): SplitDetailDto {
  const calc = calculateSplit({
    people: s.people.map((p) => ({ key: p.id, name: p.name })),
    items: s.items.map((it) => ({
      name: it.name,
      price: it.price,
      qty: it.qty,
      personKeys: it.assignments.map((a) => a.personId),
    })),
    taxBps: s.taxBps,
    serviceBps: s.serviceBps,
    discountType: s.discountType,
    discountValue: s.discountValue,
  });
  const byPerson = new Map(calc.people.map((p) => [p.key, p]));
  const debts = s.people.flatMap((p) => (p.debt ? [p.debt] : []));
  return {
    id: s.id,
    title: s.title,
    date: toDateOnly(s.date),
    wallet: s.wallet,
    taxBps: s.taxBps,
    serviceBps: s.serviceBps,
    discountType: s.discountType,
    discountValue: s.discountValue,
    subtotal: s.subtotal,
    taxAmount: calc.taxAmount,
    serviceAmount: calc.serviceAmount,
    discountAmount: calc.discountAmount,
    grandTotal: s.grandTotal,
    shareToken: s.shareToken,
    shareUrl: `${appUrl.replace(/\/$/, '')}/s/${s.shareToken}`,
    items: s.items.map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      qty: it.qty,
      personIds: it.assignments.map((a) => a.personId),
    })),
    people: s.people.map((p) => {
      const c = byPerson.get(p.id);
      return {
        id: p.id,
        name: p.name,
        isOwner: p.isOwner,
        share: p.share,
        subtotal: c?.subtotal ?? 0,
        extras: p.share - (c?.subtotal ?? 0),
        lines: c?.lines ?? [],
        debt: p.debt
          ? {
              status: p.debt.status,
              markedPaidAt: p.debt.markedPaidAt?.toISOString() ?? null,
              confirmedAt: p.debt.confirmedAt?.toISOString() ?? null,
              wallet: p.debt.wallet,
            }
          : null,
      };
    }),
    ...debtTotals(debts),
  };
}
