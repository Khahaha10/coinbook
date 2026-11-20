import type { BillDto } from '@coinbook/shared';
import { api, categoryByName, createUser, prisma, walletByName, type TestUser } from './helpers';
import { testEnv } from './test-env';

const PATH = '/internal/cron/bill-reminders';

describe('bill reminder cron', () => {
  let user: TestUser;
  let bill: BillDto;

  beforeAll(async () => {
    user = await createUser({ email: 'reminder@example.test' });
    const res = await api()
      .post('/bills')
      .set(user.auth)
      .send({
        name: 'Spotify',
        amount: 54_990,
        cycle: 'MONTHLY',
        dueDate: '2026-11-19',
        walletId: (await walletByName(user, 'Tunai')).id,
        categoryId: (await categoryByName(user, 'Tagihan')).id,
        remindDays: [1],
      })
      .expect(201);
    bill = res.body as BillDto;
  });

  afterAll(() => prisma.$disconnect());

  it('rejects a missing or wrong secret', async () => {
    await api().post(PATH).expect(401);
    await api().post(PATH).set('x-cron-secret', 'wrong-secret').expect(401);
    expect(await prisma.reminderLog.count({ where: { billId: bill.id } })).toBe(0);
  });

  it('sends each reminder once when run twice', async () => {
    const secret = testEnv().CRON_SECRET;
    const first = await api().post(PATH).set('x-cron-secret', secret).expect(200);
    expect(first.body.sent).toBeGreaterThanOrEqual(1);
    expect(first.body.failed).toBe(0);

    const second = await api().post(PATH).set('x-cron-secret', secret).expect(200);
    expect(second.body.sent).toBe(0);
    expect(second.body.skipped).toBeGreaterThanOrEqual(1);

    const logs = await prisma.reminderLog.findMany({ where: { billId: bill.id } });
    expect(logs.map((l) => [l.channel, l.daysBefore])).toEqual([['EMAIL', 1]]);
  });
});
