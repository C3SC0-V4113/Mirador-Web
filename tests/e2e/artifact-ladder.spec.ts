import { expect, test, type Page } from '@playwright/test';

/**
 * Smoke of the 3-level visualization ladder (ADR-0005/0008/0009). Hermetic:
 * `/api/chat/messages` is intercepted at the browser level with fixed
 * fixtures, so these tests exercise the real frontend pipeline (chat client
 * normalization, artifact dispatch, Recharts, vega-embed, sandboxed iframe)
 * without a backend, database, or LLM.
 */

const email = process.env.DEV_CEO_EMAIL ?? 'ceo@empresa.com';
const password = process.env.DEV_CEO_PASSWORD ?? 'mirador-dev';

interface FixtureArtifact {
  artifact_id: string;
  artifact_type: string;
  question: string;
  period?: string;
  summary?: string;
  freshness: { generated_at: string; status: string };
  chart_spec?: unknown;
  data?: Record<string, unknown>[];
  labels?: Record<string, string>;
  sandbox_html?: string;
  sandbox_metadata?: { external_resources: string[]; blocked_items: string[] };
  trace_id: string;
}

function chatResponse(artifacts: FixtureArtifact[]) {
  return {
    answer: 'Respuesta de prueba e2e.',
    suggested_questions: [],
    artifacts,
    warnings: [],
    trace_id: 'e2e-trace',
  };
}

const freshness = { generated_at: new Date().toISOString(), status: 'fresh' };

const CHART_ARTIFACT: FixtureArtifact = {
  artifact_id: 'e2e-chart',
  artifact_type: 'chart',
  question: 'Evolución del MRR',
  period: 'últimos 3 meses',
  freshness,
  chart_spec: { type: 'bar', x: 'month', y: ['mrr'] },
  data: [
    { month: 'Ene', mrr: 42000 },
    { month: 'Feb', mrr: 45000 },
    { month: 'Mar', mrr: 47000 },
  ],
  trace_id: 'e2e-trace',
};

const DYNAMIC_ARTIFACT: FixtureArtifact = {
  artifact_id: 'e2e-dynamic',
  artifact_type: 'dynamic_chart',
  question: 'Mapa de calor de ingresos',
  summary: 'Heatmap de prueba.',
  freshness,
  chart_spec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    data: {
      values: [
        { cliente: 'Atlas', mes: 'Ene', ingresos: 10 },
        { cliente: 'Atlas', mes: 'Feb', ingresos: 12 },
        { cliente: 'Zenith', mes: 'Ene', ingresos: 8 },
        { cliente: 'Zenith', mes: 'Feb', ingresos: 9 },
      ],
    },
    mark: 'rect',
    encoding: {
      x: { field: 'mes', type: 'nominal' },
      y: { field: 'cliente', type: 'nominal' },
      color: { field: 'ingresos', type: 'quantitative' },
    },
  },
  trace_id: 'e2e-trace',
};

const SANDBOX_ARTIFACT: FixtureArtifact = {
  artifact_id: 'e2e-sandbox',
  artifact_type: 'sandbox_dashboard',
  question: 'Dashboard general',
  freshness,
  sandbox_html: '<html><head></head><body><h1>Panel E2E</h1><p>Contenido aislado</p></body></html>',
  sandbox_metadata: { external_resources: [], blocked_items: [] },
  trace_id: 'e2e-trace',
};

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // Cold Turbopack + parallel workers: the first click can land before React
  // hydrates the form and gets lost. One retry absorbs that race.
  try {
    await expect(page).toHaveURL(/\/chat$/, { timeout: 20_000 });
  } catch {
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/chat$/, { timeout: 45_000 });
  }
}

async function respondWith(page: Page, artifacts: FixtureArtifact[]) {
  await page.route('**/api/chat/messages', async (route) => {
    await route.fulfill({ json: chatResponse(artifacts) });
  });
}

async function send(page: Page, text: string) {
  const composer = page.getByLabel('Escribe tu mensaje');
  await composer.fill(text);
  await composer.press('Enter');
}

test('level 1: a chart artifact renders through the Recharts path', async ({ page }) => {
  await login(page);
  await respondWith(page, [CHART_ARTIFACT]);
  await send(page, 'Evolución del MRR');

  await expect(page.getByText('Evolución del MRR').last()).toBeVisible();
  // ChartContainer renders as role="img" with an accessible label.
  await expect(page.getByRole('img').first()).toBeVisible();
});

test('level 2: a dynamic_chart artifact renders real Vega-Lite SVG', async ({ page }) => {
  await login(page);
  await respondWith(page, [DYNAMIC_ARTIFACT]);
  await send(page, 'Mapa de calor de ingresos');

  const figure = page.locator('figure[aria-label^="Gráfico dinámico"]');
  await expect(figure).toBeVisible();
  // vega-embed draws an actual SVG with graphics marks.
  await expect(figure.locator('svg [role="graphics-symbol"]').first()).toBeVisible();
});

test('level 3: enabling the preference requires consent and the sandbox renders isolated', async ({
  page,
}) => {
  await login(page);

  // Enabling the risky preference must go through the confirmation dialog.
  await page.getByRole('button', { name: 'Abrir menú de usuario' }).click();
  await page
    .getByRole('menuitemcheckbox', { name: 'Paneles interactivos (beta con riesgos)' })
    .click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Activar' }).click();
  await expect(dialog).toBeHidden();
  await page.keyboard.press('Escape');

  await respondWith(page, [SANDBOX_ARTIFACT]);
  await send(page, 'Dashboard general del negocio');

  // Permanent risk banner + exact sandbox attribute (never allow-same-origin).
  await expect(page.getByText('entorno aislado', { exact: false }).first()).toBeVisible();
  const iframe = page.locator('iframe');
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer');

  // The isolated document really renders its own content.
  await expect(
    page.frameLocator('iframe').getByRole('heading', { name: 'Panel E2E' })
  ).toBeVisible();

  // The expanded view reuses the same sandboxed frame component.
  await page.getByRole('button', { name: 'Ampliar panel' }).click();
  const frames = page.locator('iframe');
  await expect(frames).toHaveCount(2);
  await expect(frames.nth(0)).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(frames.nth(1)).toHaveAttribute('sandbox', 'allow-scripts');
});

test('level 3 with the preference off: historical sandbox renders read-only', async ({ page }) => {
  await login(page);
  await respondWith(page, [SANDBOX_ARTIFACT]);
  await send(page, 'Dashboard general del negocio');

  // The panel is still visible (historical policy) but editing is disabled.
  await expect(page.locator('iframe')).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(page.getByLabel('Pedir un cambio al panel interactivo')).toBeDisabled();
  await expect(
    page.getByText('activa la preferencia para editarlo', { exact: false })
  ).toBeVisible();
});
