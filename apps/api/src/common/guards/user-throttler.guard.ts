import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AppRequest } from '../auth/auth-user';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as AppRequest;
    return request.user ? `user:${request.user.id}` : `ip:${request.ip ?? 'unknown'}`;
  }
}
