import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

export const NOW = new Date('2026-11-18T10:00:00+07:00');
const BOOTSTRAP_TIMEOUT_MS = 90_000;

export type Theme = 'light' | 'dark';

export const CONTEXT_OPTIONS = {
  baseURL: 'http://localhost:3000',
  locale: 'id-ID',
  timezoneId: 'Asia/Jakarta',
  reducedMotion: 'reduce' as const,
};

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.clock.setFixedTime(NOW);
    await provide(page);
  },
});

export { expect };

export async function preparePage(page: Page, theme: Theme = 'light'): Promise<Page> {
  await page.clock.setFixedTime(NOW);
  await page.addInitScript((t) => localStorage.setItem('coinbook-theme', t), theme);
  return page;
}

export async function startDemo(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Lihat demo' }).first().click();
  await page.waitForURL('**/dashboard', { timeout: BOOTSTRAP_TIMEOUT_MS });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Halo', {
    timeout: BOOTSTRAP_TIMEOUT_MS,
  });
}

export async function demoContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext(CONTEXT_OPTIONS);
  const page = await preparePage(await context.newPage());
  await startDemo(page);
  await page.close();
  return context;
}

export interface DemoSplit {
  id: string;
  token: string;
}

export async function warungSate(page: Page): Promise<DemoSplit> {
  await page.goto('/splits');
  await page.getByRole('link', { name: /Patungan Warung Sate/ }).click();
  await page.waitForURL(/\/splits\/[0-9a-f-]{36}$/);
  const id = page.url().split('/').at(-1) ?? '';
  const share = await page
    .getByText(/coinbook\.app\/s\/[A-Za-z0-9_-]+/)
    .first()
    .textContent();
  const token = /coinbook\.app\/s\/([A-Za-z0-9_-]+)/.exec(share ?? '')?.[1] ?? '';
  expect(id).not.toBe('');
  expect(token).not.toBe('');
  return { id, token };
}

export interface AppPage {
  name: string;
  path: string;
  ready: string;
  auth: boolean;
}

export function appPages(split: DemoSplit): AppPage[] {
  return [
    { name: 'landing', path: '/', ready: '#l-h', auth: false },
    { name: 'login', path: '/login', ready: '#l-mail', auth: false },
    { name: 'public split', path: `/s/${split.token}`, ready: '.slip', auth: false },
    { name: 'dashboard', path: '/dashboard', ready: 'h1', auth: true },
    { name: 'transactions', path: '/transactions', ready: '.pb-row', auth: true },
    { name: 'wallets', path: '/wallets', ready: '.wcov', auth: true },
    { name: 'bills', path: '/bills', ready: '.bill', auth: true },
    { name: 'splits', path: '/splits', ready: '.srow', auth: true },
    { name: 'split detail', path: `/splits/${split.id}`, ready: '.slip', auth: true },
    { name: 'create split', path: '/splits/new', ready: '#w-t', auth: true },
    { name: 'reports', path: '/reports', ready: '.tr-col', auth: true },
    { name: 'settings', path: '/settings', ready: '#st-n', auth: true },
  ];
}

export async function openPage(page: Page, target: AppPage): Promise<void> {
  await page.goto(target.path);
  await page.locator(target.ready).first().waitFor({ timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
}
