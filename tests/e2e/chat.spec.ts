import { expect, test } from '@playwright/test';

const email = process.env.DEV_CEO_EMAIL ?? 'ceo@empresa.com';
const password = process.env.DEV_CEO_PASSWORD ?? 'mirador-dev';

test('logs in and gets a stubbed answer with suggested questions', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/chat$/);

  const composer = page.getByLabel('Escribe tu mensaje');
  await composer.fill('¿Cómo va el negocio?');
  await composer.press('Enter');

  // The composer clears and the user's message is echoed in its own bubble.
  await expect(composer).toHaveValue('');
  await expect(
    page.locator('[data-slot="chat-bubble-body"]', { hasText: '¿Cómo va el negocio?' })
  ).toBeVisible();

  // The dev stub answers and offers suggested questions.
  await expect(page.getByText('Recibí tu pregunta', { exact: false })).toBeVisible();
  await expect(page.getByText('Preguntas sugeridas')).toBeVisible();
  await expect(
    page.getByRole('button', { name: '¿Qué riesgos detectas en la operación actual?' })
  ).toBeVisible();

  // Typed artifacts render inline, each with its freshness signal (ADR-0005).
  await expect(page.getByText('Detalle mensual')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'mrr' })).toBeVisible();
  await expect(page.getByText('Datos actuales').first()).toBeVisible();
});
