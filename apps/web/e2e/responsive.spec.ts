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
} from './fixtures';

const WIDTHS = [320, 375, 768, 1024, 1440, 1920];
const HEIGHT = 900;

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

test('no page scrolls sideways from 320 to 1920 px', async () => {
  const overflow: string[] = [];
  for (const target of appPages(split)) {
    const page = await preparePage(await (target.auth ? owner : guest).newPage());
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: HEIGHT });
      await openPage(page, target);
      const [scrollWidth, innerWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        window.innerWidth,
      ]);
      if (scrollWidth > innerWidth) overflow.push(`${target.name} @${width}: ${scrollWidth}`);
    }
    await page.close();
  }
  expect(overflow).toEqual([]);
});
