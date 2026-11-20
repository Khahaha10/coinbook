import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: './e2e/design',
  testIgnore: [],
  workers: 1,
  timeout: 600_000,
});
