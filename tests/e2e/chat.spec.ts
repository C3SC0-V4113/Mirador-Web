import { expect, test } from '@playwright/test';

import { login } from './helpers';

test('logs in and gets a stubbed answer with suggested questions', async ({ page }) => {
  await login(page);

  const composer = page.getByLabel('Escribe tu mensaje');
  await composer.fill('¿Cómo va el negocio?');
  await composer.press('Enter');

  // The composer clears and the user's message is echoed in its own bubble.
  // Exact match: the stub's assistant answer quotes the question («...»), so a
  // substring locator would resolve to BOTH bubbles once the answer renders
  // (strict mode violation on slower browsers).
  await expect(composer).toHaveValue('');
  await expect(page.getByText('¿Cómo va el negocio?', { exact: true })).toBeVisible();

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
