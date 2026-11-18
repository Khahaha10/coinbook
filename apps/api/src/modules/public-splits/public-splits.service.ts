import { Injectable } from '@nestjs/common';
import { formatRupiah, toDateOnly, type PublicSplitDto } from '@coinbook/shared';
import { AppError } from '../../common/errors/app-error';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { splitDetailInclude, toSplitDetailDto } from '../splits/splits.mapper';

const publicInclude = {
  ...splitDetailInclude,
  user: {
    select: {
      id: true,
      name: true,
      bankInfo: true,
      email: true,
      emailReminders: true,
      telegramChatId: true,
      isDemo: true,
    },
  },
};

@Injectable()
export class PublicSplitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async get(token: string): Promise<PublicSplitDto> {
    const split = await this.prisma.split.findUnique({
      where: { shareToken: token },
      include: publicInclude,
    });
    if (!split) throw AppError.notFound('Split');
    const detail = toSplitDetailDto(split, '');
    const ownerName = split.user.name;
    return {
      title: split.title,
      date: toDateOnly(split.date),
      ownerName,
      ownerFirstName: ownerName.split(/\s+/)[0] ?? ownerName,
      bankInfo: split.user.bankInfo,
      receipt: {
        items: split.items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
          total: it.price * it.qty,
        })),
        subtotal: detail.subtotal,
        taxBps: detail.taxBps,
        taxAmount: detail.taxAmount,
        serviceBps: detail.serviceBps,
        serviceAmount: detail.serviceAmount,
        discountType: detail.discountType,
        discountValue: detail.discountValue,
        discountAmount: detail.discountAmount,
        grandTotal: detail.grandTotal,
      },
      people: detail.people.map((p) => ({
        id: p.id,
        name: p.name,
        isOwner: p.isOwner,
        share: p.share,
        subtotal: p.subtotal,
        extras: p.extras,
        lines: p.lines,
        status: p.debt?.status ?? null,
      })),
    };
  }

  async markPaid(token: string, personId: string): Promise<PublicSplitDto> {
    const changed = await this.prisma.$transaction(async (tx) => {
      const split = await tx.split.findUnique({
        where: { shareToken: token },
        include: { user: publicInclude.user },
      });
      if (!split) throw AppError.notFound('Split');
      const person = await tx.splitPerson.findFirst({
        where: { id: personId, splitId: split.id, isOwner: false },
      });
      if (!person) throw AppError.notFound('Person');
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Debt" WHERE "personId" = ${personId}::uuid FOR UPDATE`;
      if (locked.length === 0) throw AppError.notFound('Debt');
      const debt = await tx.debt.findUniqueOrThrow({ where: { personId } });
      if (debt.status === 'PAID') {
        throw new AppError('DEBT_ALREADY_PAID', 'This share is already confirmed');
      }
      if (debt.status === 'PENDING') return null;
      await tx.debt.update({
        where: { personId },
        data: { status: 'PENDING', markedPaidAt: new Date() },
      });
      return { owner: split.user, name: person.name, amount: debt.amount, title: split.title };
    });
    if (changed) {
      this.notifications.notifyInBackground(
        changed.owner,
        `${changed.name} bilang sudah transfer ${formatRupiah(changed.amount)} untuk ${changed.title}.`,
      );
    }
    return this.get(token);
  }
}
