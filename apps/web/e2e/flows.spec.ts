import { CONTEXT_OPTIONS, expect, preparePage, startDemo, test, warungSate } from './fixtures';
import { fillWizard } from './wizard';

test('demo: landing → Lihat demo → dashboard balance', async ({ page }) => {
  await startDemo(page);
  await expect(page.getByText('Rp4.250.000').first()).toBeVisible();
});

test('mobile: add an expense from the FAB', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await startDemo(page);
  await page.goto('/transactions');
  await page.locator('.pb-row').first().waitFor();
  await page.getByRole('button', { name: 'Catat transaksi' }).last().click();
  const dialog = page.getByRole('dialog', { name: 'Catat transaksi' });
  await dialog.getByLabel('Nominal').fill('25000');
  await dialog.getByLabel('Catatan').fill('Makan malam');
  await dialog.getByRole('button', { name: 'Simpan transaksi' }).click();
  await expect(page.getByRole('status')).toHaveText('Transaksi disimpan');
  await expect(dialog).toBeHidden();
  await expect(page.locator('.pb-row').first()).toContainText('Makan malam');
  await expect(page.locator('.pb-row').first()).toContainText('25.000');
  await expect(page.getByText('Rp4.225.000').first()).toBeVisible();
});

test('bills: mark Spotify paid', async ({ page }) => {
  await startDemo(page);
  await page.goto('/bills');
  const row = page.locator('li.bill').filter({ hasText: 'Spotify' });
  await row.getByRole('button', { name: 'Tandai lunas' }).click();
  await expect(page.getByRole('status')).toHaveText('Ditandai lunas');
  await expect(row.getByText('Lunas', { exact: true })).toBeVisible();
  await expect(row).toContainText('19 Des');
});

test('split: create through all 4 steps, detail matches the preview', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await startDemo(page);
  await page.goto('/splits/new');
  await fillWizard(page);
  const preview = page.getByLabel('Pratinjau struk');
  for (const total of ['Rp45.500', 'Rp78.000', 'Rp6.500']) {
    await expect(preview.getByText(total).first()).toBeVisible();
  }
  await expect(page.getByText('Total tagihan').locator('..')).toContainText('Rp175.500');

  await page.getByRole('button', { name: 'Buat patungan' }).click();
  await page.waitForURL(/\/splits\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Patungan Warung Sate');
  await expect(page.getByText('Rp175.500').first()).toBeVisible();
  const slots = page.locator('.slot');
  await expect(slots.filter({ hasText: 'Bagian Budi' })).toContainText('Rp45.500');
  await expect(slots.filter({ hasText: 'Bagian Sari' })).toContainText('Rp78.000');
  await expect(slots.filter({ hasText: 'Bagian Dimas' })).toContainText('Rp6.500');
  await expect(slots.filter({ hasText: 'Bagianmu' })).toContainText('Rp45.500');
});

test('public page: Sari marks paid, owner sees waiting', async ({ page, browser }) => {
  await startDemo(page);
  const split = await warungSate(page);

  const friend = await browser.newContext(CONTEXT_OPTIONS);
  const pub = await preparePage(await friend.newPage());
  await pub.goto(`/s/${split.token}`);
  await pub.getByRole('button', { name: 'Sari' }).click();
  await expect(pub.getByRole('button', { name: 'Sari' })).toHaveAttribute('aria-pressed', 'true');
  await pub.getByRole('button', { name: 'Saya sudah transfer' }).click();
  await expect(pub.getByText(/Terima kasih!/)).toBeVisible();
  await friend.close();

  await page.goto(`/splits/${split.id}`);
  await expect(page.locator('.slot').filter({ hasText: 'Bagian Sari' })).toContainText(
    'Menunggu konfirmasi',
  );
});
