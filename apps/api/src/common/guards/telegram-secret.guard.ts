import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ENV, type Env } from '../../config/env';
import { AppError } from '../errors/app-error';

@Injectable()
export class TelegramSecretGuard implements CanActivate {
  constructor(@Inject(ENV) private readonly env: Env) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.env.TELEGRAM_WEBHOOK_SECRET;
    const header =
      context.switchToHttp().getRequest<Request>().header('x-telegram-bot-api-secret-token') ?? '';
    const given = Buffer.from(header);
    const expected = Buffer.from(secret ?? '');
    if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new AppError('UNAUTHORIZED', 'Invalid Telegram secret');
    }
    return true;
  }
}
