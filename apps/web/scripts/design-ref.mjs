import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(webDir, '../../coinbook-design/Coinbook.html');
const outDir = resolve(webDir, 'e2e/design/ref');
const SETTLE_MS = 6000;

if (!existsSync(source)) {
  console.error(`Missing ${source}`);
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const slug = (title) =>
  title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1700, height: 7000 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(source).href, { waitUntil: 'load' });
await page.waitForFunction(
  () => document.querySelectorAll('section.board iframe').length > 0,
);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(SETTLE_MS);

const boards = page.locator('section.board');
const count = await boards.count();
for (let i = 0; i < count; i += 1) {
  const board = boards.nth(i);
  const title = (await board.locator('h2').first().textContent())?.trim() ?? `board-${i}`;
  const frame = board.locator('iframe').first();
  await frame.scrollIntoViewIfNeeded();
  const { width, height, left, top } = await frame.evaluate((f) => {
    const r = f.getBoundingClientRect();
    return {
      width: Number(f.getAttribute('width')),
      height: Number(f.getAttribute('height')),
      left: r.left + f.clientLeft,
      top: r.top + f.clientTop,
    };
  });
  const file = resolve(outDir, `${slug(title)}.png`);
  await page.screenshot({ path: file, clip: { x: left, y: top, width, height } });
  console.log(`${slug(title)}.png ${width}x${height}`);
}
await browser.close();
