import type { TransactionDto, TransferResultDto, WalletDto } from '@coinbook/shared';
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

const DATE = '2026-11-18';

describe('wallet balances', () => {
  let user: TestUser;
  let bca: WalletDto;
  let tunai: WalletDto;
  let food: string;
  let salary: string;

  const expectBalances = async (expected: Record<string, number>) => {
    expect(await balances(user)).toEqual(expected);
    expect(await findBalanceMismatches(prisma, user.id)).toEqual([]);
  };

  beforeAll(async () => {
    user = await createUser();
    const created = await api()
      .post('/wallets')
      .set(user.auth)
      .send({ name: 'BCA', type: 'BANK', openingBalance: 1_000_000 })
      .expect(201);
    bca = created.body as WalletDto;
    tunai = await walletByName(user, 'Tunai');
    food = (await categoryByName(user, 'Makan & minum')).id;
    salary = (await categoryByName(user, 'Gaji')).id;
  });

  afterAll(() => prisma.$disconnect());

  it('follows create, edit and delete of transactions and transfers', async () => {
    await expectBalances({ Tunai: 0, BCA: 1_000_000 });

    const expense = (
      await api()
        .post('/transactions')
        .set(user.auth)
        .send({ type: 'EXPENSE', amount: 50_000, walletId: bca.id, categoryId: food, date: DATE })
        .expect(201)
    ).body as TransactionDto;
    await expectBalances({ Tunai: 0, BCA: 950_000 });

    await api()
      .post('/transactions')
      .set(user.auth)
      .send({ type: 'INCOME', amount: 200_000, walletId: tunai.id, categoryId: salary, date: DATE })
      .expect(201);
    await expectBalances({ Tunai: 200_000, BCA: 950_000 });

    await api()
      .patch(`/transactions/${expense.id}`)
      .set(user.auth)
      .send({ amount: 80_000 })
      .expect(200);
    await expectBalances({ Tunai: 200_000, BCA: 920_000 });

    await api()
      .patch(`/transactions/${expense.id}`)
      .set(user.auth)
      .send({ walletId: tunai.id })
      .expect(200);
    await expectBalances({ Tunai: 120_000, BCA: 1_000_000 });

    const transfer = (
      await api()
        .post('/wallets/transfer')
        .set(user.auth)
        .send({ fromWalletId: bca.id, toWalletId: tunai.id, amount: 300_000, date: DATE })
        .expect(201)
    ).body as TransferResultDto;
    await expectBalances({ Tunai: 420_000, BCA: 700_000 });

    await api()
      .patch(`/transactions/${transfer.transactionId}`)
      .set(user.auth)
      .send({ amount: 100_000 })
      .expect(200);
    await expectBalances({ Tunai: 220_000, BCA: 900_000 });

    await api().delete(`/transactions/${transfer.transactionId}`).set(user.auth).expect(204);
    await expectBalances({ Tunai: 120_000, BCA: 1_000_000 });

    await api().delete(`/transactions/${expense.id}`).set(user.auth).expect(204);
    await expectBalances({ Tunai: 200_000, BCA: 1_000_000 });
  });

  it('rejects a transfer to the same wallet', async () => {
    const res = await api()
      .post('/wallets/transfer')
      .set(user.auth)
      .send({ fromWalletId: bca.id, toWalletId: bca.id, amount: 1_000, date: DATE })
      .expect(422);
    expect(res.body.error.code).toBe('SAME_WALLET');
    await expectBalances({ Tunai: 200_000, BCA: 1_000_000 });
  });
});
