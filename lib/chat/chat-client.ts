import { chatStrings } from '@/lib/chat/strings';
import { CHART_TYPES } from '@/lib/chat/types';

import type {
  ActionPlanItem,
  ArtifactRow,
  BackendActionItem,
  BackendArtifact,
  BackendChartSpec,
  BackendChatResponse,
  BackendCitation,
  ChartSpec,
  ChartType,
  ChatArtifact,
  ChatMessageRequest,
  ChatMessageResponse,
  Citation,
} from '@/lib/chat/types';

/**
 * Client-side chat client. Talks to the same-origin BFF route handler
 * (`/api/chat/messages`), never to `mirador-core` directly (ADR-0003), and maps
 * the snake_case backend contract to the camelCase domain types.
 */
export async function sendChatMessage(
  request: ChatMessageRequest,
  signal?: AbortSignal
): Promise<ChatMessageResponse> {
  const response = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as BackendChatResponse;
  return normalizeResponse(data);
}

function normalizeResponse(data: BackendChatResponse): ChatMessageResponse {
  return {
    answer: typeof data.answer === 'string' ? data.answer : '',
    citations: (data.citations ?? []).map(normalizeCitation),
    suggestedQuestions: (data.suggested_questions ?? []).filter(isNonEmptyString),
    artifacts: (data.artifacts ?? []).map(normalizeArtifact),
    warnings: (data.warnings ?? []).filter(isNonEmptyString),
    traceId: data.trace_id ?? null,
  };
}

function normalizeCitation(citation: BackendCitation): Citation {
  return {
    documentId: citation.document_id,
    title: citation.title,
    locator: citation.locator,
    snippet: citation.snippet,
  };
}

function normalizeArtifact(artifact: BackendArtifact): ChatArtifact {
  return {
    artifactId: artifact.artifact_id ?? crypto.randomUUID(),
    artifactType: artifact.artifact_type ?? 'text',
    question: artifact.question,
    period: artifact.period,
    sourceViews: artifact.source_views ?? undefined,
    freshness: artifact.freshness
      ? {
          generatedAt: artifact.freshness.generated_at ?? undefined,
          status: artifact.freshness.status ?? undefined,
        }
      : undefined,
    summary: artifact.summary,
    data: artifact.data ? artifact.data.map(normalizeRow) : undefined,
    chartSpec: artifact.chart_spec ? normalizeChartSpec(artifact.chart_spec) : undefined,
    actions: artifact.actions ? artifact.actions.map(normalizeActionItem) : undefined,
    citations: artifact.citations ? artifact.citations.map(normalizeCitation) : undefined,
    warnings: (artifact.warnings ?? []).filter(isNonEmptyString),
    traceId: artifact.trace_id ?? null,
  };
}

function normalizeChartSpec(spec: BackendChartSpec): ChartSpec {
  const y = Array.isArray(spec.y)
    ? spec.y.filter(isNonEmptyString)
    : typeof spec.y === 'string'
      ? [spec.y]
      : [];

  return {
    type: isChartType(spec.type) ? spec.type : 'bar',
    x: typeof spec.x === 'string' ? spec.x : '',
    y,
    series: spec.series
      ?.filter(
        (series): series is { key: string; label?: string; color?: string } =>
          typeof series?.key === 'string'
      )
      .map((series) => ({ key: series.key, label: series.label, color: series.color })),
    format: spec.format ?? undefined,
    labels: spec.labels ?? undefined,
  };
}

function normalizeActionItem(item: BackendActionItem): ActionPlanItem {
  return {
    title: item.title ?? '',
    detail: item.detail,
    kind: item.kind === 'risk' || item.kind === 'next_step' ? item.kind : 'action',
  };
}

function normalizeRow(row: Record<string, unknown>): ArtifactRow {
  const result: ArtifactRow = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      result[key] = null;
    } else if (typeof value === 'number' || typeof value === 'string') {
      result[key] = value;
    } else {
      result[key] = String(value);
    }
  }

  return result;
}

function isChartType(value: unknown): value is ChartType {
  return typeof value === 'string' && (CHART_TYPES as readonly string[]).includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === 'string' && data.error) {
      return data.error;
    }
  } catch {
    // fall through to the generic message
  }

  return chatStrings.errors.requestFailed;
}
