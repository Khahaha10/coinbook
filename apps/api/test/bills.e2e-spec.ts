import type { BillDto, BillPaymentDto } from '@coinbook/shared';
import { findBalanceMismatches } from '../src/database/wallet-balance';
import {
  api,
  balances,
  categoryByName,
  createUser,
  prisma,
  walletByName,
  type TestUser,
} from './helpers';

describe('bill payment', () => {
  let user: TestUser;
  let bill: BillDto;

  beforeAll(async () => {
    user = await createUser();
    const tunai = await walletByName(user, 'Tunai');
    const category = await categoryByName(user, 'Tagihan');
    const res = await api()
      .post('/bills')
      .set(user.auth)
      .send({
        name: 'Internet',
        amount: 100_000,
        cycle: 'MONTHLY',
        dueDate: '2026-11-20',
        walletId: tunai.id,
        categoryId: category.id,
        remindDays: [1],
      })
      .expect(201);
    bill = res.body as BillDto;
  });

  afterAll(() => prisma.$disconnect());

  it('pays once when two requests arrive together', async () => {
    const pay = () =>
      api().post(`/bills/${bill.id}/pay`).set(user.auth).send({ dueDate: '2026-11-20' });
    const statuses = (await Promise.all([pay(), pay()])).map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409]);

    const txs = await prisma.transaction.findMany({ where: { userId: user.id, source: 'BILL' } });
    expect(txs).toHaveLength(1);
    expect(txs[0]?.amount).toBe(100_000);

    const payments = await api().get(`/bills/${bill.id}/payments`).set(user.auth).expect(200);
    expect(payments.body as BillPaymentDto[]).toHaveLength(1);

    const list = await api().get('/bills').set(user.auth).expect(200);
    const paid = (list.body.data as BillDto[]).find((b) => b.id === bill.id);
    expect(paid?.nextDueDate).toBe('2026-12-20');
    expect(paid?.status).toBe('PAID');

    expect(await balances(user)).toEqual({ Tunai: -100_000 });
    expect(await findBalanceMismatches(prisma, user.id)).toEqual([]);
  });

  it('refuses to delete the bill transaction', async () => {
    const tx = await prisma.transaction.findFirstOrThrow({
      where: { userId: user.id, source: 'BILL' },
    });
    const res = await api().delete(`/transactions/${tx.id}`).set(user.auth).expect(409);
    expect(res.body.error.code).toBe('TRANSACTION_LOCKED');
  });
});
