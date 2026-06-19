import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendChatMessage } from '@/lib/chat/chat-client';

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
});
