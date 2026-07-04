import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArtifactRenderer } from '@/components/chat/artifacts/artifact-renderer';
import { ChatRuntimeProvider } from '@/components/chat/chat-runtime-provider';
import { useDynamicChartsPreference } from '@/lib/chat/dynamic-charts-preference';
import { useSandboxDashboardsPreference } from '@/lib/chat/sandbox-dashboards-preference';
import { chatStrings } from '@/lib/chat/strings';

import type { ChatArtifact } from '@/lib/chat/types';

function base(overrides: Partial<ChatArtifact>): ChatArtifact {
  return { artifactId: 'a1', artifactType: 'text', ...overrides };
}

describe('ArtifactRenderer', () => {
  it('renders a table with headers and cell values', () => {
    render(
      <ArtifactRenderer
        artifact={base({
          artifactType: 'table',
          question: 'Detalle',
          data: [
            { mes: 'Ene', mrr: 1000 },
            { mes: 'Feb', mrr: 2000 },
          ],
        })}
      />
    );

    expect(screen.getByRole('columnheader', { name: 'mes' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: 'mrr' })).toBeDefined();
    expect(screen.getByRole('cell', { name: 'Ene' })).toBeDefined();
    // 2000 is rendered via toLocaleString.
    expect(screen.getByText((2000).toLocaleString())).toBeDefined();
  });

  it('renders semantic labels as table headers while preserving raw row keys', () => {
    render(
      <ArtifactRenderer
        artifact={base({
          artifactType: 'table',
          data: [{ period_month: '2026-01', total_expenses: 1000 }],
          labels: { period_month: 'Mes', total_expenses: 'Gastos totales' },
        })}
      />
    );

    expect(screen.getByRole('columnheader', { name: 'Mes' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: 'Gastos totales' })).toBeDefined();
  });

  it('caps table height with an internal scroll container', () => {
    const rows = Array.from({ length: 50 }, (_, index) => ({ mes: `M${index}`, mrr: index }));
    const { container } = render(
      <ArtifactRenderer artifact={base({ artifactType: 'table', data: rows })} />
    );

    // The scroll wrapper is purely presentational (no accessible role), so a
    // Testing Library query cannot reach it; direct node access is the only way
    // to assert the height cap exists.
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
    const scrollWrapper = container.querySelector('.max-h-96');
    expect(scrollWrapper).not.toBeNull();
    expect(scrollWrapper?.className).toContain('overflow-auto');
  });

  it('renders historical dynamic artifacts with editing disabled when preference is off', () => {
    useDynamicChartsPreference.setState({ enabled: false });

    render(
      <ArtifactRenderer
        artifact={base({
          artifactType: 'dynamic_chart',
          dynamicChartSpec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
            data: { values: [{ month: 'Ene', mrr: 1 }] },
            mark: 'point',
          },
          data: [{ month: 'Ene', mrr: 1 }],
        })}
      />
    );

    expect(
      screen.getByText('La gráfica histórica sigue visible; activa la preferencia para editarla.')
    ).toBeDefined();
    expect(screen.getByLabelText('Pedir un cambio a la gráfica dinámica')).toHaveProperty(
      'disabled',
      true
    );
  });

  it('renders a KPI value from the first numeric field', () => {
    render(<ArtifactRenderer artifact={base({ artifactType: 'kpi', data: [{ mrr: 58000 }] })} />);

    expect(screen.getByText((58000).toLocaleString())).toBeDefined();
  });

  it('routes unknown artifact types to the fallback', () => {
    render(<ArtifactRenderer artifact={base({ artifactType: 'mystery', summary: 'algo' })} />);

    expect(screen.getByText(chatStrings.artifacts.fallbackNotice)).toBeDefined();
  });

  it('surfaces the artifact question and freshness in the frame', () => {
    // Chart artifacts include interactive controls that read the chat runtime.
    render(
      <ChatRuntimeProvider>
        <ArtifactRenderer
          artifact={base({
            artifactType: 'chart',
            question: 'Evolución del MRR',
            freshness: { status: 'fresh' },
            chartSpec: { type: 'line', x: 'month', y: ['mrr'] },
            data: [{ month: 'Ene', mrr: 1 }],
          })}
        />
      </ChatRuntimeProvider>
    );

    expect(screen.getByText('Evolución del MRR')).toBeDefined();
    expect(screen.getByText(chatStrings.artifacts.freshness.fresh)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Barras apiladas' })).toBeDefined();
  });

  describe('sandbox_dashboard', () => {
    afterEach(() => {
      useSandboxDashboardsPreference.setState({ enabled: false });
    });

    it('renders the iframe with srcDoc set and an exact allow-scripts-only sandbox attribute', async () => {
      render(
        <ArtifactRenderer
          artifact={base({
            artifactType: 'sandbox_dashboard',
            sandboxHtml: '<html><body><p>hola</p></body></html>',
          })}
        />
      );

      const iframe = await screen.findByTitle('Panel interactivo', {}, { timeout: 5000 });
      expect(iframe.tagName).toBe('IFRAME');
      expect(iframe.getAttribute('srcDoc')).toBe('<html><body><p>hola</p></body></html>');
      // Exact equality (not `.toContain`) so a future accidental addition of
      // `allow-same-origin`, `allow-forms`, `allow-popups`, or
      // `allow-downloads` fails this test immediately.
      expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    });

    it('always shows the permanent warning banner', async () => {
      render(
        <ArtifactRenderer
          artifact={base({
            artifactType: 'sandbox_dashboard',
            sandboxHtml: '<html><body><p>hola</p></body></html>',
          })}
        />
      );

      await screen.findByTitle('Panel interactivo', {}, { timeout: 5000 });
      expect(screen.getByText(chatStrings.artifacts.sandboxDashboard.warning)).toBeDefined();
    });

    it('renders read-only with editing disabled when the preference is off', async () => {
      useSandboxDashboardsPreference.setState({ enabled: false });

      render(
        <ArtifactRenderer
          artifact={base({
            artifactType: 'sandbox_dashboard',
            sandboxHtml: '<html><body><p>hola</p></body></html>',
          })}
        />
      );

      await screen.findByTitle('Panel interactivo', {}, { timeout: 5000 });
      expect(
        screen.getByText('El panel histórico sigue visible; activa la preferencia para editarlo.')
      ).toBeDefined();
      expect(screen.getByLabelText('Pedir un cambio al panel interactivo')).toHaveProperty(
        'disabled',
        true
      );
    });

    it('does not trip on legitimate inline JS containing on-like identifiers', async () => {
      // Regression: the old pattern /on\w+\s*=/ matched `var monthsCount = 12`
      // (the "onthsCount =" substring) and rejected every real dashboard.
      render(
        <ArtifactRenderer
          artifact={base({
            artifactType: 'sandbox_dashboard',
            sandboxHtml:
              '<html><body><script>var monthsCount = 12; var seasonTotal = 2;</script></body></html>',
          })}
        />
      );

      const iframe = await screen.findByTitle('Panel interactivo', {}, { timeout: 5000 });
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('does not trip on a forbidden tag mentioned inside inert script text', async () => {
      // Regression: real backend-approved output contained the JS comment
      // `// Contact panel logic (no <form>, no network calls)` — the string
      // `<form>` inside script raw text is not an element, so the semantic
      // guard must let it render.
      render(
        <ArtifactRenderer
          artifact={base({
            artifactType: 'sandbox_dashboard',
            sandboxHtml:
              '<html><body><script>// Contact panel logic (no <form>, no network calls)\nvar x = 1;</script></body></html>',
          })}
        />
      );

      const iframe = await screen.findByTitle('Panel interactivo', {}, { timeout: 5000 });
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('opens an expanded view with a second identically-sandboxed iframe', async () => {
      render(
        <ArtifactRenderer
          artifact={base({
            artifactType: 'sandbox_dashboard',
            sandboxHtml: '<html><body><p>hola</p></body></html>',
          })}
        />
      );

      await screen.findByTitle('Panel interactivo', {}, { timeout: 5000 });
      fireEvent.click(
        screen.getByRole('button', {
          name: chatStrings.artifacts.sandboxDashboard.expandLabel,
        })
      );

      const iframes = await screen.findAllByTitle('Panel interactivo', {}, { timeout: 5000 });
      expect(iframes).toHaveLength(2);
      for (const iframe of iframes) {
        expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
      }
    });

    it('renders an error state instead of the iframe when sandboxHtml fails the client-side tripwire', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <ArtifactRenderer
          artifact={base({
            artifactType: 'sandbox_dashboard',
            sandboxHtml: '<html><body><form><input /></form></body></html>',
          })}
        />
      );

      const errorMessage = await screen.findByText(
        chatStrings.artifacts.sandboxDashboard.unsafeError
      );
      expect(errorMessage).toBeDefined();
      expect(screen.queryByTitle('Panel interactivo')).toBeNull();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
