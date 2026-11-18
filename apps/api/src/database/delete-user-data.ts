import type { Prisma } from '@prisma/client';

export async function deleteUserData(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.debt.deleteMany({ where: { person: { split: { userId } } } });
  await tx.split.deleteMany({ where: { userId } });
  await tx.bill.deleteMany({ where: { userId } });
  await tx.transaction.deleteMany({ where: { userId } });
  await tx.category.deleteMany({ where: { userId } });
  await tx.wallet.deleteMany({ where: { userId } });
  await tx.profile.deleteMany({ where: { id: userId } });
}
