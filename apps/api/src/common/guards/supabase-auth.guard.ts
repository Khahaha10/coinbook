import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose';
import { z } from 'zod';
import { ENV, type Env } from '../../config/env';
import type { AppRequest, AuthUser } from '../auth/auth-user';
import { IS_PUBLIC } from '../decorators/public.decorator';
import { AppError } from '../errors/app-error';

const claimsSchema = z.object({
  sub: z.uuid(),
  is_anonymous: z.boolean().optional(),
  email: z.string().optional(),
  user_metadata: z
    .object({
      full_name: z.string().optional(),
      name: z.string().optional(),
      avatar_url: z.string().optional(),
    })
    .optional(),
});

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly hsSecret: Uint8Array | undefined;
  private readonly issuer: string;

  constructor(
    private readonly reflector: Reflector,
    @Inject(ENV) env: Env,
  ) {
    this.issuer = `${env.SUPABASE_URL}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
    this.hsSecret = env.SUPABASE_JWT_SECRET
      ? new TextEncoder().encode(env.SUPABASE_JWT_SECRET)
      : undefined;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AppRequest>();
    const token = this.bearer(req.headers.authorization);
    req.user = await this.verify(token);
    return true;
  }

  async verify(token: string): Promise<AuthUser> {
    let payload: JWTPayload;
    try {
      const options = { issuer: this.issuer, audience: 'authenticated' };
      const { alg } = decodeProtectedHeader(token);
      payload =
        alg === 'HS256' && this.hsSecret
          ? (await jwtVerify(token, this.hsSecret, options)).payload
          : (await jwtVerify(token, this.jwks, options)).payload;
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token');
    }
    const claims = claimsSchema.safeParse(payload);
    if (!claims.success) throw new AppError('UNAUTHORIZED', 'Invalid token claims');
    const { sub, is_anonymous, email, user_metadata: meta } = claims.data;
    return {
      id: sub,
      isAnonymous: is_anonymous ?? false,
      email: email || null,
      fullName: meta?.full_name || meta?.name || null,
      avatarUrl: meta?.avatar_url || null,
    };
  }

  private bearer(header: string | undefined): string {
    const match = header ? /^Bearer\s+(.+)$/i.exec(header) : null;
    if (!match?.[1]) throw new AppError('UNAUTHORIZED', 'Missing bearer token');
    return match[1];
  }
}
