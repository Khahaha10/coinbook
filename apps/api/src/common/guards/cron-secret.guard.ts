import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ENV, type Env } from '../../config/env';
import { AppError } from '../errors/app-error';

@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(@Inject(ENV) private readonly env: Env) {}

  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest<Request>().header('x-cron-secret') ?? '';
    const given = Buffer.from(header);
    const expected = Buffer.from(this.env.CRON_SECRET);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new AppError('UNAUTHORIZED', 'Invalid cron secret');
    }
    return true;
  }
}
