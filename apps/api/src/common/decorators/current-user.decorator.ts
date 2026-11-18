import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import type { AppRequest, AuthUser } from '../auth/auth-user';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const user = ctx.switchToHttp().getRequest<AppRequest>().user;
  if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated');
  return user;
});
