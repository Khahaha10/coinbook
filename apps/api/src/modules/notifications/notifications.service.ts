import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { ENV, type Env } from '../../config/env';

type Recipient = Pick<Profile, 'id' | 'email' | 'emailReminders' | 'telegramChatId' | 'isDemo'>;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  notifyInBackground(recipient: Recipient, text: string): void {
    this.notify(recipient, text).catch((e: unknown) => {
      this.logger.warn(
        `Notification to ${recipient.id} failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    });
  }

  async notify(recipient: Recipient, text: string): Promise<void> {
    if (recipient.isDemo) return;
    if (recipient.telegramChatId && this.env.TELEGRAM_BOT_TOKEN) {
      await this.sendTelegram(recipient.telegramChatId, text);
      return;
    }
    if (recipient.emailReminders && recipient.email) {
      this.logger.log(`[email fallback] to=${recipient.id} text=${text}`);
      return;
    }
    this.logger.log(`No notification channel for ${recipient.id}`);
  }

  get telegramEnabled(): boolean {
    return Boolean(this.env.TELEGRAM_BOT_TOKEN);
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    this.logger.log(`[email] to=${to} subject=${subject} text=${text}`);
  }

  async sendTelegram(chatId: string, text: string): Promise<void> {
    const res = await fetch(
      `https://api.telegram.org/bot${this.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) throw new Error(`Telegram responded ${res.status}`);
  }
}
