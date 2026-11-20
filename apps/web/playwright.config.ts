import { defineConfig, devices } from '@playwright/test';

const WEB_URL = 'http://localhost:3000';
const API_HEALTH = 'http://localhost:3001/api/v1/health';
const SERVER_TIMEOUT_MS = 300_000;

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['design/**'],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: WEB_URL,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node dist/main.js',
      cwd: '../api',
      url: API_HEALTH,
      env: { COINBOOK_FIXED_TODAY: '2026-11-18', APP_URL: 'https://coinbook.app' },
      reuseExistingServer: true,
      timeout: SERVER_TIMEOUT_MS,
    },
    {
      command: 'pnpm exec next build && pnpm exec next start --port 3000',
      url: WEB_URL,
      reuseExistingServer: true,
      timeout: SERVER_TIMEOUT_MS,
    },
  ],
});
