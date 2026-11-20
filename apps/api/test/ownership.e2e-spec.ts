import type {
  BillListDto,
  Paginated,
  SplitListDto,
  TransactionDto,
  WalletListDto,
} from '@coinbook/shared';
import { api, categoryByName, createUser, prisma, walletByName, type TestUser } from './helpers';

describe('ownership', () => {
  let owner: TestUser;
  let other: TestUser;
  let walletId: string;
  let transactionId: string;
  let billId: string;
  let splitId: string;
  let personId: string;

  beforeAll(async () => {
    owner = await createUser({ demo: true });
    other = await createUser();
    walletId = (await walletByName(owner, 'BCA')).id;
    transactionId = (await prisma.transaction.findFirstOrThrow({ where: { userId: owner.id } })).id;
    billId = (await prisma.bill.findFirstOrThrow({ where: { userId: owner.id } })).id;
    const split = await prisma.split.findFirstOrThrow({
      where: { userId: owner.id },
      include: { people: { where: { isOwner: false } } },
    });
    splitId = split.id;
    const friend = split.people[0];
    if (!friend) throw new Error('Demo split has no friends');
    personId = friend.id;
  });

  afterAll(() => prisma.$disconnect());

  it("returns 404 for another user's resources", async () => {
    const auth = other.auth;
    const category = (await categoryByName(other, 'Makan & minum')).id;
    const calls = [
      api().patch(`/wallets/${walletId}`).set(auth).send({ name: 'X' }),
      api().post(`/wallets/${walletId}/archive`).set(auth),
      api()
        .post('/transactions')
        .set(auth)
        .send({
          type: 'EXPENSE',
          amount: 1_000,
          walletId,
          categoryId: category,
          date: '2026-11-18',
        }),
      api().patch(`/transactions/${transactionId}`).set(auth).send({ note: 'x' }),
      api().delete(`/transactions/${transactionId}`).set(auth),
      api().patch(`/bills/${billId}`).set(auth).send({ name: 'X' }),
      api().post(`/bills/${billId}/pay`).set(auth).send({}),
      api().get(`/bills/${billId}/payments`).set(auth),
      api().post(`/bills/${billId}/deactivate`).set(auth),
      api().get(`/splits/${splitId}`).set(auth),
      api().post(`/splits/${splitId}/people/${personId}/confirm`).set(auth).send({}),
      api().delete(`/splits/${splitId}`).set(auth),
    ];
    const results: [number, string][] = [];
    for (const call of calls) {
      const res = await call;
      results.push([res.status, res.body?.error?.code]);
    }
    expect(results).toEqual(calls.map(() => [404, 'NOT_FOUND']));
  });

  it("never lists another user's data", async () => {
    const auth = other.auth;
    const walletList = (await api().get('/wallets').set(auth).expect(200)).body as WalletListDto;
    expect(walletList.data.map((w) => w.name)).toEqual(['Tunai']);
    expect(walletList.data.some((w) => w.id === walletId)).toBe(false);

    const txs = (await api().get('/transactions').set(auth).expect(200))
      .body as Paginated<TransactionDto>;
    expect(txs.total).toBe(0);

    const bills = (await api().get('/bills').set(auth).expect(200)).body as BillListDto;
    expect(bills.data).toEqual([]);

    const splits = (await api().get('/splits').set(auth).expect(200)).body as SplitListDto;
    expect(splits.data).toEqual([]);
    expect(splits.receivables).toEqual([]);
  });
});
