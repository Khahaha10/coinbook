import type { BrowserContext, Locator, Page } from '@playwright/test';
import {
  CONTEXT_OPTIONS,
  demoContext,
  expect,
  preparePage,
  test,
  warungSate,
  type DemoSplit,
  type Theme,
} from '../fixtures';
import { fillWizard } from '../wizard';
import { compareWithRef, type Rect } from './compare';
import { emptyAccountContext } from './sessions';

type Account = 'demo' | 'guest' | 'empty';

interface Board {
  slug: string;
  width: number;
  height: number;
  account: Account;
  path: (split: DemoSplit) => string;
  ready: string;
  fit?: boolean;
  theme?: Theme;
  setup?: (page: Page) => Promise<void>;
  masks?: (page: Page) => Locator[];
  maxRatio: number;
}

const MOBILE_HEIGHT = 844;

const detailMasks = (page: Page) => [
  page.locator('.ph p.text-meta').first(),
  page.locator('.slip .dt'),
  page.locator('.wa'),
];
const publicMasks = (page: Page) => [
  page.locator('.pub p.text-meta').nth(1),
  page.locator('.slip .dt'),
];
const walletMasks = (page: Page) => [page.locator('.wcov-bot .text-meta')];
const settingsMasks = (page: Page) => [page.locator('section[aria-labelledby="st-cat"] ul')];

async function dropExtraCategory(page: Page): Promise<void> {
  await page
    .locator('section[aria-labelledby="st-cat"] li')
    .filter({ hasText: 'Tempat tinggal' })
    .evaluate((li) => li.remove());
}

async function fillBill(page: Page): Promise<void> {
  await page.locator('#n-name').fill('YouTube Premium');
  await page.locator('#n-amt').fill('59000');
  await page.locator('#n-due').fill('2026-11-25');
  await page.locator('#n-w').selectOption({ label: 'GoPay' });
  await page.locator('#n-c').selectOption({ label: 'Hiburan' });
  const chips = page.getByRole('group', { name: 'Pengingat' }).locator('button');
  const wanted = [true, true, false];
  for (const [i, on] of wanted.entries()) {
    const pressed = (await chips.nth(i).getAttribute('aria-pressed')) === 'true';
    if (pressed !== on) await chips.nth(i).click();
  }
}

async function fillTransfer(page: Page): Promise<void> {
  await page.locator('#w-from').selectOption({ label: 'BCA' });
  await page.locator('#w-to').selectOption({ label: 'GoPay' });
  await page.locator('#w-amt').fill('200000');
}

async function openExpenseSheet(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Catat transaksi' }).last().click();
  await page.locator('#f-n').fill('25000');
  await page.locator('#f-note').fill('Makan malam');
}

async function openExpenseError(page: Page): Promise<void> {
  await page.locator('header').getByRole('button', { name: 'Catat transaksi' }).click();
  await page.getByRole('button', { name: 'Simpan transaksi' }).click();
}

const wizard = (step: number) => (page: Page) => fillWizard(page, step);

const dashboard = { path: () => '/dashboard', ready: 'h1', account: 'demo' as const };
const transactions = { path: () => '/transactions', ready: '.pb-row', account: 'demo' as const };
const bills = { path: () => '/bills', ready: '.bill', account: 'demo' as const };
const detail = {
  path: (s: DemoSplit) => `/splits/${s.id}`,
  ready: '.slip',
  account: 'demo' as const,
  masks: detailMasks,
};
const create = { path: () => '/splits/new', ready: '#w-t', account: 'demo' as const };
const publicSplit = {
  path: (s: DemoSplit) => `/s/${s.token}`,
  ready: '.slip',
  account: 'guest' as const,
  masks: publicMasks,
};

const BOARDS: Board[] = [
  { slug: 'dashboard-1440', width: 1440, height: 1100, ...dashboard, maxRatio: 0.003 },
  { slug: 'dashboard-768', width: 768, height: 1600, ...dashboard, maxRatio: 0.003 },
  {
    slug: 'dashboard-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    ...dashboard,
    maxRatio: 0.003,
  },
  {
    slug: 'dashboard-malam-1440',
    width: 1440,
    height: 1100,
    theme: 'dark',
    ...dashboard,
    maxRatio: 0.003,
  },
  {
    slug: 'dashboard-malam-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    theme: 'dark',
    ...dashboard,
    maxRatio: 0.003,
  },
  {
    slug: 'dashboard-kosong-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    ...dashboard,
    account: 'empty',
    maxRatio: 0.004,
  },
  { slug: 'transaksi-1440', width: 1440, height: 1500, ...transactions, maxRatio: 0.004 },
  { slug: 'transaksi-768', width: 768, height: 1800, ...transactions, maxRatio: 0.003 },
  {
    slug: 'transaksi-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    ...transactions,
    maxRatio: 0.004,
  },
  {
    slug: 'catat-transaksi-375',
    width: 375,
    height: MOBILE_HEIGHT,
    ...transactions,
    setup: openExpenseSheet,
    maxRatio: 0.009,
  },
  {
    slug: 'catat-transaksi-error-1440',
    width: 1440,
    height: 900,
    ...transactions,
    setup: openExpenseError,
    maxRatio: 0.004,
  },
  { slug: 'tagihan-1440', width: 1440, height: 1200, ...bills, setup: fillBill, maxRatio: 0.006 },
  { slug: 'tagihan-768', width: 768, height: 1600, ...bills, maxRatio: 0.007 },
  { slug: 'tagihan-375', width: 375, height: MOBILE_HEIGHT, fit: true, ...bills, maxRatio: 0.01 },
  { slug: 'detail-patungan-1440', width: 1440, height: 1400, ...detail, maxRatio: 0.004 },
  { slug: 'detail-patungan-768', width: 768, height: 2000, ...detail, maxRatio: 0.004 },
  {
    slug: 'detail-patungan-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    ...detail,
    maxRatio: 0.006,
  },
  {
    slug: 'detail-patungan-malam-1440',
    width: 1440,
    height: 1400,
    theme: 'dark',
    ...detail,
    maxRatio: 0.004,
  },
  {
    slug: 'detail-patungan-malam-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    theme: 'dark',
    ...detail,
    maxRatio: 0.006,
  },
  {
    slug: 'buat-patungan-langkah-4-1440',
    width: 1440,
    height: 1200,
    ...create,
    setup: wizard(4),
    maxRatio: 0.004,
  },
  {
    slug: 'buat-patungan-langkah-1-768',
    width: 768,
    height: 1100,
    ...create,
    setup: wizard(1),
    maxRatio: 0.004,
  },
  {
    slug: 'buat-patungan-langkah-3-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    ...create,
    setup: wizard(3),
    maxRatio: 0.012,
  },
  {
    slug: 'buat-patungan-langkah-2-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    ...create,
    setup: wizard(2),
    maxRatio: 0.004,
  },
  { slug: 'patungan-publik-1440', width: 1440, height: 1300, ...publicSplit, maxRatio: 0.003 },
  { slug: 'patungan-publik-768', width: 768, height: 1700, ...publicSplit, maxRatio: 0.003 },
  {
    slug: 'patungan-publik-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    ...publicSplit,
    maxRatio: 0.005,
  },
  {
    slug: 'landing-1440',
    width: 1440,
    height: 3800,
    path: () => '/',
    ready: '#l-h',
    account: 'guest',
    maxRatio: 0.002,
  },
  {
    slug: 'landing-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    path: () => '/',
    ready: '#l-h',
    account: 'guest',
    maxRatio: 0.004,
  },
  {
    slug: 'login-1440',
    width: 1440,
    height: 900,
    path: () => '/login',
    ready: '#l-mail',
    account: 'guest',
    maxRatio: 0.003,
  },
  {
    slug: 'login-375',
    width: 375,
    height: 800,
    path: () => '/login',
    ready: '#l-mail',
    account: 'guest',
    maxRatio: 0.007,
  },
  {
    slug: 'dompet-1440',
    width: 1440,
    height: 1000,
    path: () => '/wallets',
    ready: '.wcov',
    account: 'demo',
    setup: fillTransfer,
    masks: walletMasks,
    maxRatio: 0.004,
  },
  {
    slug: 'dompet-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    path: () => '/wallets',
    ready: '.wcov',
    account: 'demo',
    setup: fillTransfer,
    masks: walletMasks,
    maxRatio: 0.007,
  },
  {
    slug: 'patungan-1440',
    width: 1440,
    height: 900,
    path: () => '/splits',
    ready: '.srow',
    account: 'demo',
    maxRatio: 0.003,
  },
  {
    slug: 'patungan-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    path: () => '/splits',
    ready: '.srow',
    account: 'demo',
    maxRatio: 0.005,
  },
  {
    slug: 'laporan-1440',
    width: 1440,
    height: 1100,
    path: () => '/reports',
    ready: '.tr-col',
    account: 'demo',
    maxRatio: 0.003,
  },
  {
    slug: 'laporan-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    path: () => '/reports',
    ready: '.tr-col',
    account: 'demo',
    maxRatio: 0.004,
  },
  {
    slug: 'pengaturan-1440',
    width: 1440,
    height: 1700,
    path: () => '/settings',
    ready: '#st-n',
    account: 'demo',
    setup: dropExtraCategory,
    masks: settingsMasks,
    maxRatio: 0.004,
  },
  {
    slug: 'pengaturan-375',
    width: 375,
    height: MOBILE_HEIGHT,
    fit: true,
    path: () => '/settings',
    ready: '#st-n',
    account: 'demo',
    setup: dropExtraCategory,
    masks: settingsMasks,
    maxRatio: 0.01,
  },
];

test.describe.configure({ mode: 'serial' });

const contexts = {} as Record<Account, BrowserContext>;
let split: DemoSplit;

test.beforeAll(async ({ browser }) => {
  contexts.demo = await demoContext(browser);
  contexts.guest = await browser.newContext(CONTEXT_OPTIONS);
  contexts.empty = await emptyAccountContext(browser);
  const page = await preparePage(await contexts.demo.newPage());
  split = await warungSate(page);
  await page.close();
});

test.afterAll(async () => {
  await Promise.all(Object.values(contexts).map((c) => c.close()));
});

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

async function maskRects(page: Page, board: Board): Promise<Rect[]> {
  const rects: Rect[] = [];
  for (const locator of board.masks?.(page) ?? []) {
    for (const el of await locator.all()) {
      const box = await el.boundingBox();
      if (box) rects.push(box);
    }
  }
  return rects;
}

for (const board of BOARDS) {
  test(board.slug, async ({}, testInfo) => {
    const page = await preparePage(await contexts[board.account].newPage(), board.theme);
    await page.setViewportSize({ width: board.width, height: board.height });
    await page.goto(board.path(split));
    await page.locator(board.ready).first().waitFor({ timeout: 60_000 });
    await settle(page);
    if (board.setup) {
      await board.setup(page);
      await settle(page);
    }
    if (board.fit) {
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width: board.width, height });
      await settle(page);
    }
    const shot = await page.screenshot({ animations: 'disabled', caret: 'hide' });
    const result = compareWithRef(board.slug, shot, await maskRects(page, board));
    await page.close();
    console.log(`${board.slug} ratio=${result.ratio.toFixed(4)} ${result.width}x${result.height}`);
    if (result.ratio > board.maxRatio) {
      await testInfo.attach('actual', { body: shot, contentType: 'image/png' });
      await testInfo.attach('diff', { body: result.diff, contentType: 'image/png' });
    }
    expect(result.ratio).toBeLessThanOrEqual(board.maxRatio);
  });
}
