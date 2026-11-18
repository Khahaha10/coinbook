import { Prisma } from '@prisma/client';
import { billStatus, toDateOnly, type BillDto, type DateOnly } from '@coinbook/shared';

export const billInclude = {
  wallet: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, icon: true } },
  payments: { orderBy: { dueDate: 'desc' }, take: 1, select: { dueDate: true, paidAt: true } },
} satisfies Prisma.BillInclude;

export type BillWithRefs = Prisma.BillGetPayload<{ include: typeof billInclude }>;

export function toBillDto(b: BillWithRefs, today: DateOnly): BillDto {
  const last = b.payments[0];
  const nextDueDate = toDateOnly(b.nextDueDate);
  const lastPaidDueDate = last ? toDateOnly(last.dueDate) : null;
  const { status, daysUntilDue } = billStatus({ nextDueDate, lastPaidDueDate, today });
  return {
    id: b.id,
    name: b.name,
    amount: b.amount,
    cycle: b.cycle,
    anchorDay: b.anchorDay,
    nextDueDate,
    wallet: b.wallet,
    category: b.category,
    remindDays: b.remindDays,
    isActive: b.isActive,
    status,
    daysUntilDue,
    lastPaidAt: last ? last.paidAt.toISOString() : null,
    lastPaidDueDate,
  };
}
