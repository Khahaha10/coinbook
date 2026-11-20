import type { PublicSplitDto, SplitDetailDto } from '@coinbook/shared';
import { findBalanceMismatches } from '../src/database/wallet-balance';
import { api, balances, createUser, prisma, walletByName, type TestUser } from './helpers';

const person = (split: SplitDetailDto, name: string) => {
  const found = split.people.find((p) => p.name === name);
  if (!found) throw new Error(`Person ${name} not found`);
  return found;
};

describe('split bill', () => {
  let user: TestUser;
  let split: SplitDetailDto;

  beforeAll(async () => {
    user = await createUser();
    const tunai = await walletByName(user, 'Tunai');
    const res = await api()
      .post('/splits')
      .set(user.auth)
      .send({
        title: 'Patungan Warung Sate',
        date: '2026-11-15',
        walletId: tunai.id,
        taxBps: 1000,
        serviceBps: 2000,
        subtotal: 1,
        grandTotal: 1,
        people: [
          { key: 'me', name: 'Kamu', isOwner: true, share: 1 },
          { key: 'budi', name: 'Budi', isOwner: false, share: 1 },
          { key: 'sari', name: 'Sari', isOwner: false, share: 1 },
          { key: 'dimas', name: 'Dimas', isOwner: false, share: 1 },
        ],
        items: [
          { name: 'Sate ayam', price: 60_000, qty: 1, personKeys: ['me', 'budi'] },
          { name: 'Sate kambing', price: 52_000, qty: 1, personKeys: ['sari'] },
          { name: 'Es teh', price: 5_000, qty: 3, personKeys: ['me', 'budi', 'dimas'] },
          { name: 'Es jeruk', price: 8_000, qty: 1, personKeys: ['sari'] },
        ],
      })
      .expect(201);
    split = res.body as SplitDetailDto;
  });

  afterAll(() => prisma.$disconnect());

  it('recalculates totals on the server and books the expense', async () => {
    expect(split.subtotal).toBe(135_000);
    expect(split.grandTotal).toBe(175_500);
    expect(split.people.map((p) => [p.name, p.share])).toEqual([
      ['Kamu', 45_500],
      ['Budi', 45_500],
      ['Sari', 78_000],
      ['Dimas', 6_500],
    ]);
    expect(await balances(user)).toEqual({ Tunai: -175_500 });
  });

  it('lets a friend mark paid and the owner confirm once', async () => {
    const sari = person(split, 'Sari');
    const marked = await api()
      .post(`/public/splits/${split.shareToken}/people/${sari.id}/paid`)
      .expect(200);
    const publicSari = (marked.body as PublicSplitDto).people.find((p) => p.id === sari.id);
    expect(publicSari?.status).toBe('PENDING');

    const confirmed = await api()
      .post(`/splits/${split.id}/people/${sari.id}/confirm`)
      .set(user.auth)
      .send({})
      .expect(200);
    expect(person(confirmed.body as SplitDetailDto, 'Sari').debt?.status).toBe('PAID');

    const income = await prisma.transaction.findMany({
      where: { userId: user.id, source: 'SPLIT', type: 'INCOME' },
    });
    expect(income.map((t) => t.amount)).toEqual([78_000]);
    expect(await balances(user)).toEqual({ Tunai: -97_500 });
    expect(await findBalanceMismatches(prisma, user.id)).toEqual([]);

    const again = await api()
      .post(`/splits/${split.id}/people/${sari.id}/confirm`)
      .set(user.auth)
      .send({})
      .expect(409);
    expect(again.body.error.code).toBe('DEBT_ALREADY_PAID');
    expect(await balances(user)).toEqual({ Tunai: -97_500 });
  });

  it('refuses to delete split transactions', async () => {
    const txs = await prisma.transaction.findMany({ where: { userId: user.id, source: 'SPLIT' } });
    expect(txs).toHaveLength(2);
    for (const tx of txs) {
      const res = await api().delete(`/transactions/${tx.id}`).set(user.auth).expect(409);
      expect(res.body.error.code).toBe('TRANSACTION_LOCKED');
    }
  });
});
