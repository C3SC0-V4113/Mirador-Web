import { defineConfig, devices } from '@playwright/test';

const baseUrl = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // The dev server compiles routes on first request (Turbopack), so the first
  // navigation in a cold run can be slow. Give navigations/actions generous
  // budgets to avoid false negatives.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry',
    navigationTimeout: 90_000,
    actionTimeout: 20_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
    url: baseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
