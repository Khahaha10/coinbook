import type { Page } from '@playwright/test';

const FRIENDS = ['Budi', 'Sari', 'Dimas'];
const ITEMS: [string, string, string, string[]][] = [
  ['Sate ayam', '60000', '1', ['Kamu', 'Budi']],
  ['Sate kambing', '52000', '1', ['Sari']],
  ['Es teh', '5000', '3', ['Kamu', 'Budi', 'Dimas']],
  ['Es jeruk', '8000', '1', ['Sari']],
];

export async function fillWizard(page: Page, upToStep = 4): Promise<void> {
  const next = () => page.getByRole('button', { name: 'Lanjut' }).click();
  await page.locator('#w-t').fill('Patungan Warung Sate');
  await page.locator('#w-d').fill('2026-11-15');
  await page.locator('#w-w').selectOption({ label: 'BCA' });
  if (upToStep === 1) return;
  await next();
  for (const name of FRIENDS) {
    await page.locator('#w-np').fill(name);
    await page.locator('#w-np').press('Enter');
  }
  if (upToStep === 2) return;
  await next();
  for (const [i, [name, price, qty, who]] of ITEMS.entries()) {
    if (i > 0) await page.getByRole('button', { name: 'Tambah item' }).click();
    const item = page.locator('li.it').nth(i);
    await item.getByLabel('Nama item').fill(name);
    await item.getByLabel('Harga').fill(price);
    await item.getByLabel('Jumlah').fill(qty);
    for (const person of who) await item.getByRole('button', { name: person, exact: true }).click();
  }
  if (upToStep === 3) return;
  await next();
  await page.locator('#w-tax').fill('10');
  await page.locator('#w-svc').fill('20');
}
