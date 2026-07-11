import { defineConfig, devices } from '@playwright/test';

// Puerto propio para e2e: 3000 es de mirador-core en desarrollo, y con
// `reuseExistingServer` Playwright tomaria al backend como si fuera la web.
// Nota (Next 16): no puede haber otro `next dev` de este proyecto corriendo
// mientras corren los e2e (lock de dev server por directorio).
const baseUrl = 'http://127.0.0.1:3200';

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
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3200',
    url: baseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Hermetico: sin MIRADOR_API_URL el BFF usa el dev stub y el login usa el
    // CEO de desarrollo — los e2e no dependen del backend ni de la DB.
    // AUTH_SECRET: Auth.js v5 lanza MissingSecret si falta (tambien en dev);
    // en CI no hay .env.local, asi que se inyecta un secreto dummy valido solo
    // para la vida del servidor de pruebas.
    env: {
      MIRADOR_API_URL: '',
      DEV_CEO_EMAIL: 'ceo@empresa.com',
      DEV_CEO_PASSWORD: 'mirador-dev',
      AUTH_SECRET: 'playwright-e2e-dummy-secret-not-for-production',
    },
  },
});
