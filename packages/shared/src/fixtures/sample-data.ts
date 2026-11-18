import type {
  BillCycle,
  CategoryType,
  DebtStatus,
  DiscountType,
  TransactionSource,
  TransactionType,
  WalletType,
} from '../types/enums';
import type { DateOnly } from '../utils/dates';

export const DEMO_TODAY: DateOnly = '2026-11-18';

export interface FixtureCategory {
  key: string;
  name: string;
  type: CategoryType;
  icon: string;
}

export const DEFAULT_CATEGORIES: readonly FixtureCategory[] = [
  { key: 'makan', name: 'Makan & minum', type: 'EXPENSE', icon: 'utensils' },
  { key: 'transportasi', name: 'Transportasi', type: 'EXPENSE', icon: 'car' },
  { key: 'belanja', name: 'Belanja', type: 'EXPENSE', icon: 'shopping-bag' },
  { key: 'tagihan', name: 'Tagihan', type: 'EXPENSE', icon: 'zap' },
  { key: 'hiburan', name: 'Hiburan', type: 'EXPENSE', icon: 'film' },
  { key: 'tempat-tinggal', name: 'Tempat tinggal', type: 'EXPENSE', icon: 'house' },
  { key: 'gaji', name: 'Gaji', type: 'INCOME', icon: 'briefcase' },
];

export const DEFAULT_WALLET = { name: 'Tunai', type: 'CASH' as WalletType };

export const DEMO_PROFILE = {
  name: 'Rani Putri',
  email: 'rani@contoh.id',
  bankInfo: 'BCA 1234567890 a.n. Rani Putri',
};

export interface FixtureWallet {
  key: string;
  name: string;
  type: WalletType;
  balance: number;
}

export const DEMO_WALLETS: readonly FixtureWallet[] = [
  { key: 'bca', name: 'BCA', type: 'BANK', balance: 3_120_000 },
  { key: 'gopay', name: 'GoPay', type: 'EWALLET', balance: 530_000 },
  { key: 'tunai', name: 'Tunai', type: 'CASH', balance: 600_000 },
];

export interface FixtureTransaction {
  key: string;
  type: TransactionType;
  amount: number;
  walletKey: string;
  toWalletKey?: string;
  categoryKey?: string;
  date: DateOnly;
  description: string;
  note: string | null;
  source: TransactionSource;
}

interface HistoryMonth {
  month: string;
  label: string;
  bonus: number;
  shopping: number;
  food: number;
  electricity: boolean;
}

const HISTORY_MONTHS: readonly HistoryMonth[] = [
  {
    month: '2026-06',
    label: 'Juni',
    bonus: 0,
    shopping: 1_500_000,
    food: 1_125_000,
    electricity: true,
  },
  {
    month: '2026-07',
    label: 'Juli',
    bonus: 0,
    shopping: 1_700_000,
    food: 1_425_000,
    electricity: true,
  },
  {
    month: '2026-08',
    label: 'Agustus',
    bonus: 200_000,
    shopping: 1_300_000,
    food: 1_125_000,
    electricity: true,
  },
  {
    month: '2026-09',
    label: 'September',
    bonus: 0,
    shopping: 1_600_000,
    food: 1_325_000,
    electricity: true,
  },
  {
    month: '2026-10',
    label: 'Oktober',
    bonus: 100_000,
    shopping: 1_700_000,
    food: 1_418_000,
    electricity: false,
  },
];

function historyRows(h: HistoryMonth): FixtureTransaction[] {
  const row = (
    day: string,
    slug: string,
    type: TransactionType,
    amount: number,
    walletKey: string,
    categoryKey: string,
    description: string,
    note: string | null,
  ): FixtureTransaction => ({
    key: `h-${h.month}-${slug}`,
    type,
    amount,
    walletKey,
    categoryKey,
    date: `${h.month}-${day}`,
    description,
    note,
    source: 'MANUAL',
  });
  const name = `Gaji ${h.label}`;
  return [
    row('01', 'gaji', 'INCOME', 5_000_000, 'bca', 'gaji', name, name),
    row('03', 'sewa', 'EXPENSE', 725_000, 'bca', 'tempat-tinggal', 'Sewa kos', 'Sewa kos'),
    row(
      '10',
      'belanja',
      'EXPENSE',
      h.shopping,
      'bca',
      'belanja',
      'Belanja bulanan',
      'Belanja bulanan',
    ),
    row('14', 'transport', 'EXPENSE', 300_000, 'tunai', 'transportasi', 'Transportasi', null),
    ...(h.bonus > 0
      ? [row('15', 'bonus', 'INCOME', h.bonus, 'bca', 'gaji', 'Bonus', 'Bonus')]
      : []),
    row('20', 'hiburan', 'EXPENSE', 200_000, 'gopay', 'hiburan', 'Hiburan', null),
    ...(h.electricity
      ? [row('21', 'listrik', 'EXPENSE', 250_000, 'bca', 'tagihan', 'Listrik PLN', 'Listrik PLN')]
      : []),
    row('24', 'makan', 'EXPENSE', h.food, 'gopay', 'makan', 'Makan & minum', null),
  ];
}

export const DEMO_HISTORY: readonly FixtureTransaction[] = HISTORY_MONTHS.flatMap(historyRows);

export const DEMO_TRANSACTIONS: readonly FixtureTransaction[] = [
  ...DEMO_HISTORY,
  {
    key: 'listrik-okt',
    type: 'EXPENSE',
    amount: 245_000,
    walletKey: 'bca',
    categoryKey: 'tagihan',
    date: '2026-10-25',
    description: 'Listrik PLN',
    note: null,
    source: 'BILL',
  },
  {
    key: 'makan-malam',
    type: 'EXPENSE',
    amount: 62_000,
    walletKey: 'tunai',
    categoryKey: 'makan',
    date: '2026-10-28',
    description: 'Makan malam',
    note: 'Makan malam',
    source: 'MANUAL',
  },
  {
    key: 'pulsa',
    type: 'EXPENSE',
    amount: 50_000,
    walletKey: 'gopay',
    categoryKey: 'tagihan',
    date: '2026-10-31',
    description: 'Pulsa',
    note: 'Pulsa',
    source: 'MANUAL',
  },
  {
    key: 'gaji',
    type: 'INCOME',
    amount: 5_000_000,
    walletKey: 'bca',
    categoryKey: 'gaji',
    date: '2026-11-01',
    description: 'Gaji November',
    note: 'Gaji November',
    source: 'MANUAL',
  },
  {
    key: 'sewa-kos',
    type: 'EXPENSE',
    amount: 725_000,
    walletKey: 'bca',
    categoryKey: 'tempat-tinggal',
    date: '2026-11-03',
    description: 'Sewa kos',
    note: 'Sewa kos',
    source: 'MANUAL',
  },
  {
    key: 'tiket-bioskop',
    type: 'EXPENSE',
    amount: 100_000,
    walletKey: 'gopay',
    categoryKey: 'hiburan',
    date: '2026-11-07',
    description: 'Tiket bioskop',
    note: 'Tiket bioskop',
    source: 'MANUAL',
  },
  {
    key: 'isi-gopay',
    type: 'TRANSFER',
    amount: 200_000,
    walletKey: 'bca',
    toWalletKey: 'gopay',
    date: '2026-11-09',
    description: 'Isi GoPay dari BCA',
    note: 'Isi GoPay dari BCA',
    source: 'MANUAL',
  },
  {
    key: 'belanja-bulanan',
    type: 'EXPENSE',
    amount: 312_000,
    walletKey: 'bca',
    categoryKey: 'belanja',
    date: '2026-11-10',
    description: 'Belanja bulanan',
    note: 'Belanja bulanan',
    source: 'MANUAL',
  },
  {
    key: 'kopi',
    type: 'EXPENSE',
    amount: 28_000,
    walletKey: 'gopay',
    categoryKey: 'makan',
    date: '2026-11-12',
    description: 'Kopi',
    note: 'Kopi',
    source: 'MANUAL',
  },
  {
    key: 'bensin',
    type: 'EXPENSE',
    amount: 30_000,
    walletKey: 'tunai',
    categoryKey: 'transportasi',
    date: '2026-11-14',
    description: 'Bensin',
    note: 'Bensin',
    source: 'MANUAL',
  },
  {
    key: 'patungan-budi',
    type: 'INCOME',
    amount: 45_500,
    walletKey: 'bca',
    date: '2026-11-15',
    description: 'Patungan dari Budi',
    note: null,
    source: 'SPLIT',
  },
  {
    key: 'netflix',
    type: 'EXPENSE',
    amount: 54_000,
    walletKey: 'bca',
    categoryKey: 'tagihan',
    date: '2026-11-17',
    description: 'Netflix',
    note: null,
    source: 'BILL',
  },
  {
    key: 'makan-siang',
    type: 'EXPENSE',
    amount: 35_000,
    walletKey: 'tunai',
    categoryKey: 'makan',
    date: '2026-11-18',
    description: 'Makan siang',
    note: 'Makan siang',
    source: 'MANUAL',
  },
];

export interface FixtureBill {
  key: string;
  name: string;
  amount: number;
  cycle: BillCycle;
  anchorDay: number;
  nextDueDate: DateOnly;
  walletKey: string;
  categoryKey: string;
  remindDays: number[];
  payments: { dueDate: DateOnly; transactionKey: string }[];
}

export const DEMO_BILLS: readonly FixtureBill[] = [
  {
    key: 'internet',
    name: 'Internet',
    amount: 82_010,
    cycle: 'MONTHLY',
    anchorDay: 16,
    nextDueDate: '2026-11-16',
    walletKey: 'bca',
    categoryKey: 'tagihan',
    remindDays: [3, 1, 0],
    payments: [],
  },
  {
    key: 'spotify',
    name: 'Spotify',
    amount: 54_990,
    cycle: 'MONTHLY',
    anchorDay: 19,
    nextDueDate: '2026-11-19',
    walletKey: 'gopay',
    categoryKey: 'tagihan',
    remindDays: [3, 1, 0],
    payments: [],
  },
  {
    key: 'listrik',
    name: 'Listrik PLN',
    amount: 250_000,
    cycle: 'MONTHLY',
    anchorDay: 21,
    nextDueDate: '2026-11-21',
    walletKey: 'bca',
    categoryKey: 'tagihan',
    remindDays: [3, 1, 0],
    payments: [{ dueDate: '2026-10-21', transactionKey: 'listrik-okt' }],
  },
  {
    key: 'netflix',
    name: 'Netflix',
    amount: 54_000,
    cycle: 'MONTHLY',
    anchorDay: 17,
    nextDueDate: '2026-12-17',
    walletKey: 'bca',
    categoryKey: 'tagihan',
    remindDays: [3, 1, 0],
    payments: [{ dueDate: '2026-11-17', transactionKey: 'netflix' }],
  },
];

export interface FixtureDebt {
  status: DebtStatus;
  markedPaidAt?: string;
  confirmedAt?: string;
  walletKey?: string;
  transactionKey?: string;
}

export interface FixtureSplit {
  key: string;
  title: string;
  date: DateOnly;
  walletKey: string;
  taxBps: number;
  serviceBps: number;
  discountType: DiscountType;
  discountValue: number;
  shareToken: string | null;
  people: { key: string; name: string; isOwner: boolean }[];
  items: { name: string; price: number; qty: number; personKeys: string[] }[];
  debts: Record<string, FixtureDebt>;
}

export const DEMO_SPLITS: readonly FixtureSplit[] = [
  {
    key: 'warung-sate',
    title: 'Patungan Warung Sate',
    date: '2026-11-15',
    walletKey: 'bca',
    taxBps: 1000,
    serviceBps: 2000,
    discountType: 'NOMINAL',
    discountValue: 0,
    shareToken: 'k7Qm2xPa9vL',
    people: [
      { key: 'me', name: 'Kamu', isOwner: true },
      { key: 'budi', name: 'Budi', isOwner: false },
      { key: 'sari', name: 'Sari', isOwner: false },
      { key: 'dimas', name: 'Dimas', isOwner: false },
    ],
    items: [
      { name: 'Sate ayam', price: 60_000, qty: 1, personKeys: ['me', 'budi'] },
      { name: 'Sate kambing', price: 52_000, qty: 1, personKeys: ['sari'] },
      { name: 'Es teh', price: 5_000, qty: 3, personKeys: ['me', 'budi', 'dimas'] },
      { name: 'Es jeruk', price: 8_000, qty: 1, personKeys: ['sari'] },
    ],
    debts: {
      budi: {
        status: 'PAID',
        markedPaidAt: '2026-11-15T13:00:00+07:00',
        confirmedAt: '2026-11-15T14:00:00+07:00',
        walletKey: 'bca',
        transactionKey: 'patungan-budi',
      },
      sari: { status: 'UNPAID' },
      dimas: { status: 'PENDING', markedPaidAt: '2026-11-17T20:00:00+07:00' },
    },
  },
  {
    key: 'bensin-bandung',
    title: 'Bensin ke Bandung',
    date: '2026-11-08',
    walletKey: 'bca',
    taxBps: 0,
    serviceBps: 0,
    discountType: 'NOMINAL',
    discountValue: 0,
    shareToken: null,
    people: [
      { key: 'me', name: 'Kamu', isOwner: true },
      { key: 'budi', name: 'Budi', isOwner: false },
      { key: 'dimas', name: 'Dimas', isOwner: false },
    ],
    items: [{ name: 'Bensin', price: 240_000, qty: 1, personKeys: ['me', 'budi', 'dimas'] }],
    debts: {
      budi: { status: 'PAID', confirmedAt: '2026-11-09T10:00:00+07:00', walletKey: 'bca' },
      dimas: { status: 'PAID', confirmedAt: '2026-11-09T10:00:00+07:00', walletKey: 'bca' },
    },
  },
  {
    key: 'nonton-bareng',
    title: 'Nonton bareng',
    date: '2026-11-01',
    walletKey: 'gopay',
    taxBps: 0,
    serviceBps: 0,
    discountType: 'NOMINAL',
    discountValue: 0,
    shareToken: null,
    people: [
      { key: 'me', name: 'Kamu', isOwner: true },
      { key: 'sari', name: 'Sari', isOwner: false },
      { key: 'dimas', name: 'Dimas', isOwner: false },
    ],
    items: [{ name: 'Tiket bioskop', price: 50_000, qty: 3, personKeys: ['me', 'sari', 'dimas'] }],
    debts: {
      sari: { status: 'PAID', confirmedAt: '2026-11-02T10:00:00+07:00', walletKey: 'gopay' },
      dimas: { status: 'PAID', confirmedAt: '2026-11-02T10:00:00+07:00', walletKey: 'gopay' },
    },
  },
];
