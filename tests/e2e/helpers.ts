import { expect, type Page } from '@playwright/test';

export const DEV_CEO_EMAIL = process.env.DEV_CEO_EMAIL ?? 'ceo@empresa.com';
export const DEV_CEO_PASSWORD = process.env.DEV_CEO_PASSWORD ?? 'mirador-dev';

/**
 * Logs in through the real form, hardened against the two cold-dev-server
 * races: (a) the click can land before React hydrates the form and get lost;
 * (b) the auth callback can take >20s while Turbopack compiles it, leaving the
 * button busy/renamed. Waits long, and re-clicks only if the idle button is
 * still reachable (case a) — never while a submission is in flight.
 */
export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(DEV_CEO_EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(DEV_CEO_PASSWORD);
  const submit = page.getByRole('button', { name: 'Ingresar' });
  await submit.click();

  try {
    await expect(page).toHaveURL(/\/chat$/, { timeout: 30_000 });
  } catch {
    try {
      await submit.click({ timeout: 2_000 });
    } catch {
      // Button gone or busy: the submission is already in flight (case b).
    }
    await expect(page).toHaveURL(/\/chat$/, { timeout: 60_000 });
  }
}
