import { api, createUser, prisma, wallets, type TestUser } from './helpers';

const PUBLIC_LIMIT = 20;
const RATE_LIMIT_IP = '203.0.113.9';
const FORBIDDEN_KEYS = ['userId', 'walletId', 'email', 'wallet', 'shareToken', 'telegramChatId'];

function keysOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysOf);
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => [k, ...keysOf(v)]);
  }
  return [];
}

describe('public split endpoint', () => {
  let owner: TestUser;
  let token: string;

  beforeAll(async () => {
    owner = await createUser({ demo: true });
    const split = await prisma.split.findFirstOrThrow({
      where: { userId: owner.id, title: 'Patungan Warung Sate' },
    });
    token = split.shareToken;
  });

  afterAll(() => prisma.$disconnect());

  it('leaks no user id, email or wallet ids', async () => {
    const res = await api().get(`/public/splits/${token}`).expect(200);
    const body = JSON.stringify(res.body);
    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: owner.id } });
    const walletIds = (await wallets(owner)).data.map((w) => w.id);

    expect(body).not.toContain(owner.id);
    if (profile.email) expect(body).not.toContain(profile.email);
    for (const id of walletIds) expect(body).not.toContain(id);
    expect(keysOf(res.body).filter((k) => FORBIDDEN_KEYS.includes(k))).toEqual([]);
  });

  it('returns 404 for an unknown token', async () => {
    await api().get('/public/splits/unknownTok1').expect(404);
  });

  it('rate limits at 20 requests per minute per IP', async () => {
    const statuses: number[] = [];
    for (let i = 0; i <= PUBLIC_LIMIT; i += 1) {
      const res = await api().get(`/public/splits/${token}`).set('X-Forwarded-For', RATE_LIMIT_IP);
      statuses.push(res.status);
    }
    expect(statuses.slice(0, PUBLIC_LIMIT).every((s) => s === 200)).toBe(true);
    expect(statuses[PUBLIC_LIMIT]).toBe(429);
  });
});
