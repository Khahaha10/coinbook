import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, type ReminderChannel } from '@prisma/client';
import {
  addDays,
  diffDays,
  formatRupiah,
  fromDateOnly,
  toDateOnly,
  type DateOnly,
} from '@coinbook/shared';
import { businessToday } from '../../common/clock';
import { ENV, type Env } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const BATCH_SIZE = 100;
const MAX_REMIND_DAYS = 3;
const SUBJECT = 'Pengingat tagihan Coinbook';

const dayMonth = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export interface ReminderRunResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}

type DueBill = Prisma.BillGetPayload<{ include: { user: true } }>;

export function reminderText(
  name: string,
  amount: number,
  dueDate: DateOnly,
  daysBefore: number,
  appUrl: string,
): string {
  const when =
    daysBefore === 0
      ? 'jatuh tempo hari ini.'
      : `jatuh tempo ${daysBefore === 1 ? 'besok' : `${daysBefore} hari lagi`}, ${dayMonth.format(fromDateOnly(dueDate))}.`;
  return `${name} ${formatRupiah(amount)} ${when}\n${appUrl}/bills`;
}

@Injectable()
export class BillRemindersService {
  private readonly logger = new Logger(BillRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async run(): Promise<ReminderRunResult> {
    const today = businessToday(this.env);
    const result: ReminderRunResult = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    let cursor: string | undefined;
    for (;;) {
      const bills = await this.prisma.bill.findMany({
        where: {
          isActive: true,
          nextDueDate: {
            gte: fromDateOnly(today),
            lte: fromDateOnly(addDays(today, MAX_REMIND_DAYS)),
          },
          user: { isDemo: false },
        },
        include: { user: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (bills.length === 0) break;
      for (const bill of bills) await this.remind(bill, today, result);
      cursor = bills.at(-1)?.id;
      if (bills.length < BATCH_SIZE) break;
    }
    this.logger.log(`Bill reminders: ${JSON.stringify(result)}`);
    return result;
  }

  private channels(bill: DueBill): ReminderChannel[] {
    const list: ReminderChannel[] = [];
    if (bill.user.telegramChatId && this.notifications.telegramEnabled) list.push('TELEGRAM');
    if (bill.user.emailReminders && bill.user.email) list.push('EMAIL');
    return list;
  }

  private async remind(bill: DueBill, today: DateOnly, result: ReminderRunResult): Promise<void> {
    const dueDate = toDateOnly(bill.nextDueDate);
    const daysBefore = diffDays(today, dueDate);
    if (!bill.remindDays.includes(daysBefore)) return;
    result.processed += 1;
    const text = reminderText(bill.name, bill.amount, dueDate, daysBefore, this.env.APP_URL);
    for (const channel of this.channels(bill)) {
      const log = await this.claim(bill.id, bill.nextDueDate, daysBefore, channel);
      if (!log) {
        result.skipped += 1;
        continue;
      }
      try {
        await this.send(bill, channel, text);
        result.sent += 1;
      } catch (e: unknown) {
        result.failed += 1;
        await this.prisma.reminderLog.delete({ where: { id: log } });
        this.logger.warn(
          `Reminder ${bill.id}/${channel} failed: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  private async claim(
    billId: string,
    dueDate: Date,
    daysBefore: number,
    channel: ReminderChannel,
  ): Promise<string | null> {
    try {
      const row = await this.prisma.reminderLog.create({
        data: { billId, dueDate, daysBefore, channel },
      });
      return row.id;
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return null;
      throw e;
    }
  }

  private send(bill: DueBill, channel: ReminderChannel, text: string): Promise<void> {
    if (channel === 'TELEGRAM' && bill.user.telegramChatId) {
      return this.notifications.sendTelegram(bill.user.telegramChatId, text);
    }
    if (channel === 'EMAIL' && bill.user.email) {
      return this.notifications.sendEmail(bill.user.email, SUBJECT, text);
    }
    return Promise.resolve();
  }
}
