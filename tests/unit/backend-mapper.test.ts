import { describe, expect, it } from 'vitest';

import { toFrontendChatResponse } from '@/lib/chat/backend-mapper';

describe('toFrontendChatResponse', () => {
  it('maps message to answer and carries conversation/trace ids', () => {
    const result = toFrontendChatResponse({
      trace_id: 't1',
      conversation_id: 'c1',
      message: 'Resumen ejecutivo',
      artifacts: [],
      warnings: [],
      suggested_questions: ['¿Y el churn?'],
    });

    expect(result.answer).toBe('Resumen ejecutivo');
    expect(result.trace_id).toBe('t1');
    expect(result.conversation_id).toBe('c1');
    expect(result.suggested_questions).toEqual(['¿Y el churn?']);
    expect(result.citations).toEqual([]);
  });

  it('unwraps a CHART artifact: id, lowercased type, payload.rows, chart_spec, source_views', () => {
    const result = toFrontendChatResponse({
      message: '',
      metadata: { source_views: ['ceo_revenue_summary'] },
      artifacts: [
        {
          id: 'a1',
          type: 'CHART',
          summary: 'Evolución del MRR',
          payload: {
            metric: 'monthly_revenue',
            rows: [
              { period_month: '2026-01', revenue: 50000 },
              { period_month: '2026-02', revenue: 55000 },
            ],
          },
          chart_spec: { type: 'line', x: 'period_month', y: 'revenue' },
        },
      ],
    });

    expect(result.artifacts).toHaveLength(1);
    const [artifact] = result.artifacts ?? [];
    expect(artifact.artifact_id).toBe('a1');
    expect(artifact.artifact_type).toBe('chart');
    expect(artifact.summary).toBe('Evolución del MRR');
    expect(artifact.source_views).toEqual(['ceo_revenue_summary']);
    expect(artifact.data).toHaveLength(2);
    expect(artifact.chart_spec).toMatchObject({ type: 'line', x: 'period_month', y: 'revenue' });
    // Rows must be unwrapped, not left nested under payload.
    expect(artifact).not.toHaveProperty('payload');
  });

  it('unwraps an ACTION_PLAN artifact: payload.actions becomes top-level actions', () => {
    const result = toFrontendChatResponse({
      message: 'Plan',
      artifacts: [
        {
          id: 'a2',
          type: 'ACTION_PLAN',
          summary: 'Tres frentes',
          payload: {
            metric: 'churn',
            actions: [
              { title: 'Activar onboarding', detail: 'Reduce fricción' },
              { title: 'Métricas de salud' },
            ],
            rows: [],
          },
          chart_spec: null,
        },
      ],
    });

    const [artifact] = result.artifacts ?? [];
    expect(artifact.artifact_type).toBe('action_plan');
    expect(artifact.actions).toEqual([
      { title: 'Activar onboarding', detail: 'Reduce fricción', kind: undefined },
      { title: 'Métricas de salud', detail: undefined, kind: undefined },
    ]);
    expect(artifact.chart_spec).toBeUndefined();
  });

  it('maps DYNAMIC_CHART specs and semantic labels without changing row keys', () => {
    const result = toFrontendChatResponse({
      message: 'Mapa de calor',
      artifacts: [
        {
          id: 'dynamic-1',
          type: 'DYNAMIC_CHART',
          payload: {
            rows: [{ period_month: '2026-01', mrr: 50000 }],
            labels: { period_month: 'Mes', mrr: 'MRR' },
          },
          chart_spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
            data: { values: [{ period_month: '2026-01', mrr: 50000 }] },
            mark: 'rect',
          },
        },
      ],
    });

    const [artifact] = result.artifacts ?? [];
    expect(artifact.artifact_type).toBe('dynamic_chart');
    expect(artifact.labels).toEqual({ period_month: 'Mes', mrr: 'MRR' });
    expect(artifact.data?.[0]).toHaveProperty('period_month');
    expect(artifact.chart_spec).toMatchObject({ mark: 'rect' });
  });

  it('maps a TEXT clarification artifact without rows or chart', () => {
    const result = toFrontendChatResponse({
      message: 'Precisá la métrica',
      warnings: ['metric_not_resolved'],
      artifacts: [
        { id: 'a3', type: 'TEXT', summary: 'Precisá la métrica', payload: { clarification: true } },
      ],
    });

    const [artifact] = result.artifacts ?? [];
    expect(artifact.artifact_type).toBe('text');
    expect(artifact.data).toBeUndefined();
    expect(artifact.chart_spec).toBeUndefined();
    expect(result.warnings).toEqual(['metric_not_resolved']);
  });

  it('is defensive against malformed input', () => {
    expect(toFrontendChatResponse(null)).toMatchObject({ answer: '', artifacts: [] });
    expect(toFrontendChatResponse({ artifacts: 'nope' })).toMatchObject({ artifacts: [] });
  });
});
