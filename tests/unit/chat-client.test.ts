import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { editSandboxDashboardVisualization, sendChatMessage } from '@/lib/chat/chat-client';

import type { BackendChatResponse } from '@/lib/chat/types';

const fetchMock = vi.fn();

function mockBackend(payload: BackendChatResponse) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => payload,
  } as Response);
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendChatMessage artifact normalization', () => {
  it('maps a chart artifact to camelCase and normalizes the chart spec', async () => {
    mockBackend({
      answer: 'Resumen',
      artifacts: [
        {
          artifact_id: 'a1',
          artifact_type: 'chart',
          question: 'Evolución del MRR',
          freshness: { generated_at: '2026-06-01T00:00:00Z', status: 'fresh' },
          chart_spec: { type: 'line', x: 'month', y: 'mrr' },
          data: [
            { month: 'Ene', mrr: 1 },
            { month: 'Feb', mrr: 2 },
          ],
          trace_id: 't1',
        },
      ],
    });

    const result = await sendChatMessage({ content: 'x', intentMode: 'analizar' });

    expect(result.artifacts).toHaveLength(1);
    const [artifact] = result.artifacts;
    expect(artifact).toMatchObject({
      artifactId: 'a1',
      artifactType: 'chart',
      question: 'Evolución del MRR',
    });
    expect(artifact.freshness).toEqual({ generatedAt: '2026-06-01T00:00:00Z', status: 'fresh' });
    expect(artifact.chartSpec).toMatchObject({ type: 'line', x: 'month', y: ['mrr'] });
    expect(artifact.data).toHaveLength(2);
  });

  it('falls back to a bar chart for an unknown chart type', async () => {
    mockBackend({
      answer: '',
      artifacts: [
        {
          artifact_id: 'a2',
          artifact_type: 'chart',
          chart_spec: { type: 'donut', x: 'month', y: ['mrr'] },
        },
      ],
    });

    const result = await sendChatMessage({ content: 'x', intentMode: 'responder' });
    expect(result.artifacts[0].chartSpec?.type).toBe('bar');
  });

  it('returns an empty artifact list when the backend omits artifacts', async () => {
    mockBackend({ answer: 'Solo texto' });

    const result = await sendChatMessage({ content: 'x', intentMode: 'responder' });
    expect(result.artifacts).toEqual([]);
  });

  it('keeps a dynamic Vega-Lite spec separate from the Recharts chart contract', async () => {
    mockBackend({
      answer: 'Mapa de calor',
      artifacts: [
        {
          artifact_id: 'dynamic-1',
          artifact_type: 'dynamic_chart',
          chart_spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
            data: { values: [{ month: 'Ene', mrr: 1 }] },
            mark: 'rect',
          },
          data: [{ month: 'Ene', mrr: 1 }],
          labels: { month: 'Mes', mrr: 'MRR' },
        },
      ],
    });

    const result = await sendChatMessage({
      content: 'heatmap',
      intentMode: 'analizar',
      dynamicChartsEnabled: true,
    });

    expect(result.artifacts[0].chartSpec).toBeUndefined();
    expect(result.artifacts[0].dynamicChartSpec).toMatchObject({ mark: 'rect' });
    expect(result.artifacts[0].labels).toEqual({ month: 'Mes', mrr: 'MRR' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat/messages',
      expect.objectContaining({
        body: JSON.stringify({
          content: 'heatmap',
          intentMode: 'analizar',
          dynamicChartsEnabled: true,
        }),
      })
    );
  });

  it('sends sandboxDashboardsEnabled:true in the request body', async () => {
    mockBackend({ answer: 'ok', artifacts: [] });

    await sendChatMessage({
      content: 'dame un panel',
      intentMode: 'reporte_visual',
      sandboxDashboardsEnabled: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat/messages',
      expect.objectContaining({
        body: JSON.stringify({
          content: 'dame un panel',
          intentMode: 'reporte_visual',
          sandboxDashboardsEnabled: true,
        }),
      })
    );
  });

  it('threads the caller-provided flag into sandbox edit requests', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ requires_main_chat: false, sandbox_html: '<html></html>' }),
    } as Response);

    await editSandboxDashboardVisualization('artifact-1', 'agrega un panel', true);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/chat/artifacts/artifact-1/visualization',
      expect.objectContaining({
        body: JSON.stringify({ message: 'agrega un panel', sandbox_dashboards_enabled: true }),
      })
    );

    await editSandboxDashboardVisualization('artifact-1', 'agrega un panel', false);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/chat/artifacts/artifact-1/visualization',
      expect.objectContaining({
        body: JSON.stringify({ message: 'agrega un panel', sandbox_dashboards_enabled: false }),
      })
    );
  });

  it('maps a sandbox_dashboard artifact to camelCase and leaves chartSpec/dynamicChartSpec undefined', async () => {
    mockBackend({
      answer: 'Panel',
      artifacts: [
        {
          artifact_id: 'sandbox-1',
          artifact_type: 'sandbox_dashboard',
          question: 'Panel de ventas',
          sandbox_html: '<html><body><p>hola</p></body></html>',
          sandbox_metadata: {
            external_resources: [],
            blocked_items: ['<script src="https://evil.example.com/x.js">'],
          },
          trace_id: 't2',
        },
      ],
    });

    const result = await sendChatMessage({ content: 'panel', intentMode: 'reporte_visual' });

    expect(result.artifacts).toHaveLength(1);
    const [artifact] = result.artifacts;
    expect(artifact.sandboxHtml).toBe('<html><body><p>hola</p></body></html>');
    expect(artifact.sandboxMetadata).toEqual({
      externalResources: [],
      blockedItems: ['<script src="https://evil.example.com/x.js">'],
    });
    expect(artifact.chartSpec).toBeUndefined();
    expect(artifact.dynamicChartSpec).toBeUndefined();
  });
});
