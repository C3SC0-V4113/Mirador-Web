import { chatStrings } from '@/lib/chat/strings';
import { CHART_TYPES } from '@/lib/chat/types';

import type { FrontendConversationMessage } from '@/lib/chat/backend-mapper';
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
  ChatUiMessage,
  Citation,
  ConversationSummary,
  DynamicChartSpec,
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

/** A visualization edit: natural language, or a structured chart-type/axis change. */
export type ChartVisualizationEdit =
  | { message: string }
  | { chartSpec: { type: ChartType; x: string | null; y: string } };

/** Result of a visualization edit: applied spec, or a redirect to the main chat. */
export type ChartVisualizationResult =
  | { requiresMainChat: true; reason: string }
  | {
      requiresMainChat: false;
      artifactType?: ChatArtifact['artifactType'];
      chartSpec?: ChartSpec;
      dynamicChartSpec?: DynamicChartSpec;
      note?: string;
    };

export type DynamicChartVisualizationResult =
  | { requiresMainChat: true; reason: string }
  | { requiresMainChat: false; chartSpec: DynamicChartSpec };

/**
 * Edits a chart artifact's visualization via the BFF. Supports the structured
 * mode (chart type / axes, no LLM) and natural language (which may redirect to
 * the main chat when the request needs new data).
 */
export async function editChartVisualization(
  artifactId: string,
  edit: ChartVisualizationEdit,
  dynamicChartsEnabled = false,
  signal?: AbortSignal
): Promise<ChartVisualizationResult> {
  const body =
    'message' in edit
      ? { message: edit.message, dynamic_charts_enabled: dynamicChartsEnabled }
      : { chart_spec: edit.chartSpec, dynamic_charts_enabled: dynamicChartsEnabled };

  const response = await fetch(
    `/api/chat/artifacts/${encodeURIComponent(artifactId)}/visualization`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as {
    requires_main_chat?: boolean;
    reason?: string;
    artifact_type?: string;
    chart_spec?: BackendChartSpec | DynamicChartSpec | null;
    note?: string;
  };

  if (data.requires_main_chat) {
    return { requiresMainChat: true, reason: typeof data.reason === 'string' ? data.reason : '' };
  }

  const isDynamic = data.artifact_type === 'dynamic_chart';

  return {
    requiresMainChat: false,
    artifactType: data.artifact_type as ChatArtifact['artifactType'] | undefined,
    chartSpec: !isDynamic
      ? normalizeChartSpec((data.chart_spec ?? {}) as BackendChartSpec)
      : undefined,
    dynamicChartSpec: isDynamic && isRecord(data.chart_spec) ? data.chart_spec : undefined,
    note: typeof data.note === 'string' ? data.note : undefined,
  };
}

export async function editDynamicChartVisualization(
  artifactId: string,
  message: string,
  dynamicChartsEnabled = true,
  signal?: AbortSignal
): Promise<DynamicChartVisualizationResult> {
  const response = await fetch(
    `/api/chat/artifacts/${encodeURIComponent(artifactId)}/visualization`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, dynamic_charts_enabled: dynamicChartsEnabled }),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as {
    requires_main_chat?: boolean;
    reason?: string;
    chart_spec?: unknown;
  };

  if (data.requires_main_chat) {
    return { requiresMainChat: true, reason: typeof data.reason === 'string' ? data.reason : '' };
  }

  return {
    requiresMainChat: false,
    chartSpec: isRecord(data.chart_spec) ? data.chart_spec : {},
  };
}

/**
 * Maps the backend conversation list payload into typed summaries. Pure — used
 * by the server-side data loader (`lib/server/conversations.ts`).
 */
export function normalizeConversationSummary(value: unknown): ConversationSummary | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.id !== 'string') {
    return null;
  }

  return {
    id: record.id,
    title: typeof record.title === 'string' ? record.title : null,
    lastMessage: typeof record.lastMessage === 'string' ? record.lastMessage : null,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  };
}

/** Maps one past message (snake_case contract) into a UI message. Pure. */
export function toUiMessage(message: FrontendConversationMessage): ChatUiMessage {
  if (message.role === 'user') {
    return {
      kind: 'message',
      id: message.id,
      role: 'user',
      content: message.content,
      status: 'complete',
    };
  }

  const artifacts = message.artifacts.map(normalizeArtifact);

  return {
    kind: 'message',
    id: message.id,
    role: 'assistant',
    content: message.content,
    status: 'complete',
    artifacts: artifacts.length > 0 ? artifacts : undefined,
    warnings: message.warnings.length > 0 ? message.warnings : undefined,
    traceId: message.trace_id ?? undefined,
  };
}

function normalizeResponse(data: BackendChatResponse): ChatMessageResponse {
  return {
    answer: typeof data.answer === 'string' ? data.answer : '',
    citations: (data.citations ?? []).map(normalizeCitation),
    suggestedQuestions: (data.suggested_questions ?? []).filter(isNonEmptyString),
    artifacts: (data.artifacts ?? []).map(normalizeArtifact),
    warnings: (data.warnings ?? []).filter(isNonEmptyString),
    traceId: data.trace_id ?? null,
    conversationId: typeof data.conversation_id === 'string' ? data.conversation_id : null,
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
  const isDynamic = artifact.artifact_type === 'dynamic_chart';
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
    chartSpec:
      !isDynamic && artifact.chart_spec ? normalizeChartSpec(artifact.chart_spec) : undefined,
    dynamicChartSpec: isDynamic && isRecord(artifact.chart_spec) ? artifact.chart_spec : undefined,
    labels: artifact.labels ?? undefined,
    actions: artifact.actions ? artifact.actions.map(normalizeActionItem) : undefined,
    citations: artifact.citations ? artifact.citations.map(normalizeCitation) : undefined,
    warnings: (artifact.warnings ?? []).filter(isNonEmptyString),
    traceId: artifact.trace_id ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
