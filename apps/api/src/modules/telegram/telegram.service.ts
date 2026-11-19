import { randomInt } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import type { MeDto, TelegramLinkDto } from '@coinbook/shared';
import { AppError } from '../../common/errors/app-error';
import { ENV, type Env } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { toMeDto } from '../me/me.mapper';
import { NotificationsService } from '../notifications/notifications.service';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

export const LINKED_TEXT =
  'Telegram terhubung ke Coinbook. Pengingat tagihan akan dikirim ke sini.';
export const INVALID_TEXT =
  'Kode tidak valid atau sudah kedaluwarsa. Buat kode baru dari halaman Pengaturan.';

export const telegramUpdateSchema = z.object({
  message: z
    .object({
      text: z.string().optional(),
      chat: z.object({ id: z.union([z.number(), z.string()]) }),
      from: z.object({ username: z.string().optional() }).optional(),
    })
    .optional(),
});
export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;

function generateCode(): string {
  return Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join('');
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async createLink(userId: string): Promise<TelegramLinkDto> {
    const username = this.env.TELEGRAM_BOT_USERNAME;
    if (!username || !this.notifications.telegramEnabled) {
      throw new AppError('INTERNAL_ERROR', 'Telegram is not configured');
    }
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = generateCode();
      try {
        await this.prisma.profile.update({
          where: { id: userId },
          data: { telegramLinkCode: code, telegramLinkExpiresAt: expiresAt },
        });
        return {
          code,
          url: `https://t.me/${username}?start=${code}`,
          expiresAt: expiresAt.toISOString(),
        };
      } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
        throw e;
      }
    }
    throw new AppError('INTERNAL_ERROR', 'Could not create a link code');
  }

  async disconnect(userId: string): Promise<MeDto> {
    const profile = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkCode: null,
        telegramLinkExpiresAt: null,
      },
    });
    return toMeDto(profile);
  }

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message;
    const match = message?.text?.trim().match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/);
    if (!message || !match) return;
    const chatId = String(message.chat.id);
    const linked = match[1]
      ? await this.link(match[1].toUpperCase(), chatId, message.from?.username)
      : false;
    try {
      await this.notifications.sendTelegram(chatId, linked ? LINKED_TEXT : INVALID_TEXT);
    } catch (e: unknown) {
      this.logger.warn(`Telegram reply failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private link(code: string, chatId: string, username: string | undefined): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findFirst({
        where: { telegramLinkCode: code, telegramLinkExpiresAt: { gt: new Date() } },
      });
      if (!profile) return false;
      await tx.profile.updateMany({
        where: { telegramChatId: chatId, id: { not: profile.id } },
        data: { telegramChatId: null, telegramUsername: null },
      });
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          telegramChatId: chatId,
          telegramUsername: username ?? null,
          telegramLinkCode: null,
          telegramLinkExpiresAt: null,
        },
      });
      return true;
    });
  }
}
