import { expect, test } from '@playwright/test';

test('redirects unauthenticated users from the chat to the login', async ({ page }) => {
  await page.goto('/chat');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Inicia sesión')).toBeVisible();
  await expect(page.getByLabel('Correo')).toBeVisible();
});

test('toggles password visibility on the login form', async ({ page }) => {
  await page.goto('/login');

  const password = page.getByLabel('Contraseña', { exact: true });
  await expect(password).toHaveAttribute('type', 'password');

  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(password).toHaveAttribute('type', 'text');
});
