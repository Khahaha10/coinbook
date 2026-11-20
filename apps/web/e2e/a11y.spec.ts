import AxeBuilder from '@axe-core/playwright';
import type { BrowserContext } from '@playwright/test';
import {
  appPages,
  CONTEXT_OPTIONS,
  demoContext,
  expect,
  openPage,
  preparePage,
  test,
  warungSate,
  type DemoSplit,
  type Theme,
} from './fixtures';

const THEMES: Theme[] = ['light', 'dark'];
const WIDTHS = [375, 1440];
const BLOCKING = ['serious', 'critical'];

test.describe.configure({ mode: 'serial' });

let owner: BrowserContext;
let guest: BrowserContext;
let split: DemoSplit;

test.beforeAll(async ({ browser }) => {
  owner = await demoContext(browser);
  guest = await browser.newContext(CONTEXT_OPTIONS);
  const page = await preparePage(await owner.newPage());
  split = await warungSate(page);
  await page.close();
});

test.afterAll(async () => {
  await owner.close();
  await guest.close();
});

for (const theme of THEMES) {
  test(`axe: no serious or critical violations (${theme})`, async () => {
    const found: string[] = [];
    for (const target of appPages(split)) {
      const page = await preparePage(await (target.auth ? owner : guest).newPage(), theme);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await openPage(page, target);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const result = await new AxeBuilder({ page }).analyze();
        for (const v of result.violations) {
          if (!BLOCKING.includes(v.impact ?? '')) continue;
          for (const node of v.nodes) {
            found.push(`${target.name} @${width}: ${v.id} ${node.target.join(' ')}`);
          }
        }
      }
      await page.close();
    }
    expect(found).toEqual([]);
  });
}
