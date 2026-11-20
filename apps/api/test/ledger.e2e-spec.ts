import type { Paginated, TransactionDto } from '@coinbook/shared';
import { api, balances, createUser, prisma, walletByName, wallets, type TestUser } from './helpers';

const LEDGER: [number, number][] = [
  [35_000, 4_250_000],
  [54_000, 4_285_000],
  [45_500, 4_339_000],
  [30_000, 4_293_500],
  [28_000, 4_323_500],
  [312_000, 4_351_500],
  [200_000, 4_663_500],
  [100_000, 4_663_500],
  [725_000, 4_763_500],
  [5_000_000, 5_488_500],
  [50_000, 488_500],
  [62_000, 538_500],
  [245_000, 600_500],
];

const BCA_LEDGER: [number, number][] = [
  [54_000, 4_285_000],
  [45_500, 4_339_000],
  [312_000, 4_351_500],
  [200_000, 4_663_500],
  [725_000, 4_763_500],
  [5_000_000, 5_488_500],
  [245_000, 600_500],
];

const rows = (list: TransactionDto[]) => list.map((t) => [t.amount, t.balanceAfter]);

describe('ledger with the demo seed fixed to 18 Nov 2026', () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createUser({ demo: true });
  });

  afterAll(() => prisma.$disconnect());

  it('returns the design balances on the first page', async () => {
    const res = await api().get('/transactions?pageSize=13').set(user.auth).expect(200);
    const page = res.body as Paginated<TransactionDto>;
    expect(rows(page.data)).toEqual(LEDGER);
    expect(page.total).toBe(49);
    expect(page.totalPages).toBe(4);
  });

  it('keeps the same balances when filtered by wallet', async () => {
    const bca = await walletByName(user, 'BCA');
    const res = await api()
      .get(`/transactions?walletId=${bca.id}&pageSize=7`)
      .set(user.auth)
      .expect(200);
    expect(rows((res.body as Paginated<TransactionDto>).data)).toEqual(BCA_LEDGER);
  });

  it('returns the 5 latest rows for the dashboard', async () => {
    const res = await api().get('/transactions/recent').set(user.auth).expect(200);
    expect(rows(res.body as TransactionDto[])).toEqual(LEDGER.slice(0, 5));
  });

  it('matches the design wallet balances', async () => {
    expect(await balances(user)).toEqual({ BCA: 3_120_000, GoPay: 530_000, Tunai: 600_000 });
    expect((await wallets(user)).total).toBe(4_250_000);
  });
});
