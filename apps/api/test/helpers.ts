import { createHmac, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import type { CategoryDto, WalletDto, WalletListDto } from '@coinbook/shared';
import { apiBaseUrl, testEnv } from './test-env';

const TOKEN_TTL_S = 3600;

export const api = () => request(apiBaseUrl());

export const prisma = new PrismaClient({ datasourceUrl: testEnv().DATABASE_URL });

const b64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

export function signToken(claims: { sub: string; email?: string; isAnonymous?: boolean }): string {
  const env = testEnv();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      sub: claims.sub,
      email: claims.email,
      is_anonymous: claims.isAnonymous ?? false,
      aud: 'authenticated',
      iss: `${env.SUPABASE_URL}/auth/v1`,
      role: 'authenticated',
      iat: now,
      exp: now + TOKEN_TTL_S,
    }),
  );
  const signature = createHmac('sha256', env.SUPABASE_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export interface TestUser {
  id: string;
  auth: { Authorization: string };
}

export async function createUser(opts: { demo?: boolean; email?: string } = {}): Promise<TestUser> {
  const id = randomUUID();
  const token = signToken({ sub: id, email: opts.email, isAnonymous: opts.demo ?? false });
  const user = { id, auth: { Authorization: `Bearer ${token}` } };
  await api()
    .post(opts.demo ? '/me/bootstrap?demo=true' : '/me/bootstrap')
    .set(user.auth)
    .expect(200);
  return user;
}

export async function wallets(user: TestUser): Promise<WalletListDto> {
  const res = await api().get('/wallets').set(user.auth).expect(200);
  return res.body as WalletListDto;
}

export async function walletByName(user: TestUser, name: string): Promise<WalletDto> {
  const wallet = (await wallets(user)).data.find((w) => w.name === name);
  if (!wallet) throw new Error(`Wallet ${name} not found`);
  return wallet;
}

export async function categoryByName(user: TestUser, name: string): Promise<CategoryDto> {
  const res = await api().get('/categories').set(user.auth).expect(200);
  const category = (res.body as CategoryDto[]).find((c) => c.name === name);
  if (!category) throw new Error(`Category ${name} not found`);
  return category;
}

export async function balances(user: TestUser): Promise<Record<string, number>> {
  return Object.fromEntries((await wallets(user)).data.map((w) => [w.name, w.balance]));
}
