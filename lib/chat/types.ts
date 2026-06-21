/**
 * Domain types for the Mirador chat surface.
 *
 * These are the frontend's own types — they do not mirror `other-gpt`. The
 * backend contract (snake_case) lives in the `Backend*` interfaces and is mapped
 * to the camelCase domain types by `lib/chat/chat-client.ts`. See
 * `docs/architecture/api-contracts.md` and ADR-0005.
 */

/** Composer intent modes. Mirrors `mirador-core`'s `intent_mode` enum. */
export type ChatIntentMode = 'responder' | 'analizar' | 'reporte_visual' | 'plan';

export const CHAT_INTENT_MODES: readonly ChatIntentMode[] = [
  'responder',
  'analizar',
  'reporte_visual',
  'plan',
] as const;

export const DEFAULT_INTENT_MODE: ChatIntentMode = 'responder';

/** Lifecycle of a rendered message bubble. */
export type ChatMessageStatus = 'pending' | 'complete' | 'error' | 'interrupted';

/** A document-grounded reference (knowledge answers only). */
export interface Citation {
  documentId: string;
  title: string;
  locator: string;
  snippet: string;
}

// ---------------------------------------------------------------------------
// Chat artifacts (ADR-0005)
// ---------------------------------------------------------------------------

/** Allowed artifact types (ADR-0005). Unknown values route to the fallback. */
export type ChatArtifactType =
  | 'text'
  | 'table'
  | 'kpi'
  | 'chart'
  | 'report'
  | 'action_plan'
  | 'knowledge';

/** Chart kinds rendered with the shadcn chart (Recharts). */
export type ChartType = 'line' | 'bar' | 'area' | 'pie';

export const CHART_TYPES: readonly ChartType[] = ['line', 'bar', 'area', 'pie'] as const;

/** One chart series — a value key present in each data row. */
export interface ChartSeries {
  key: string;
  label?: string;
  color?: string;
}

/** Normalized chart description (from the backend `chart_spec`). */
export interface ChartSpec {
  type: ChartType;
  x: string;
  y: string[];
  series?: ChartSeries[];
  format?: string;
  labels?: Record<string, string>;
}

/** Per-artifact recency signal. */
export interface ArtifactFreshness {
  generatedAt?: string;
  status?: string;
}

/** A row in an artifact's tabular `data`. */
export type ArtifactRow = Record<string, string | number | null>;

/** A single entry in an `action_plan` artifact. */
export interface ActionPlanItem {
  title: string;
  detail?: string;
  kind?: 'action' | 'risk' | 'next_step';
}

/**
 * A structured result rendered inline under the assistant narrative (ADR-0005).
 * `artifactType` is typed as `string` so unknown/future types reach the fallback
 * renderer rather than failing the type-check.
 */
export interface ChatArtifact {
  artifactId: string;
  artifactType: string;
  question?: string;
  period?: string;
  sourceViews?: string[];
  freshness?: ArtifactFreshness;
  summary?: string;
  data?: ArtifactRow[];
  chartSpec?: ChartSpec;
  actions?: ActionPlanItem[];
  citations?: Citation[];
  warnings?: string[];
  traceId?: string | null;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** A user/assistant turn, or a system error bubble. */
export type ChatUiMessage =
  | {
      kind: 'message';
      id: string;
      role: 'user' | 'assistant';
      content: string;
      status: ChatMessageStatus;
      citations?: Citation[];
      suggestedQuestions?: string[];
      artifacts?: ChatArtifact[];
      warnings?: string[];
      traceId?: string | null;
      retryPrompt?: string;
    }
  | {
      kind: 'error';
      id: string;
      role: 'system';
      content: string;
      status: 'error';
      retryPrompt?: string;
    };

/** A failed send kept so the user can retry the exact prompt. */
export interface ChatRetryRequest {
  prompt: string;
  intentMode: ChatIntentMode;
}

/** A past conversation shown in the history surface. */
export interface ConversationSummary {
  id: string;
  title: string | null;
  lastMessage: string | null;
  updatedAt: string;
}

/** Request the UI sends to the BFF route handler. */
export interface ChatMessageRequest {
  content: string;
  intentMode: ChatIntentMode;
  conversationId?: string;
  contextArtifactId?: string;
}

/** Normalized response the UI consumes (mapped from the backend contract). */
export interface ChatMessageResponse {
  answer: string;
  citations: Citation[];
  suggestedQuestions: string[];
  artifacts: ChatArtifact[];
  warnings: string[];
  traceId: string | null;
  /** Conversation this turn belongs to; threaded into the next request. */
  conversationId: string | null;
}

// ---------------------------------------------------------------------------
// Backend contract (snake_case) — only the fields the UI consumes are typed.
// ---------------------------------------------------------------------------

export interface BackendCitation {
  document_id: string;
  title: string;
  locator: string;
  snippet: string;
}

export interface BackendFreshness {
  generated_at?: string | null;
  status?: string | null;
}

export interface BackendChartSpec {
  type?: string | null;
  x?: string | null;
  y?: string | string[] | null;
  series?: { key?: string; label?: string; color?: string }[] | null;
  format?: string | null;
  labels?: Record<string, string> | null;
  [key: string]: unknown;
}

export interface BackendActionItem {
  title?: string;
  detail?: string;
  kind?: string;
}

export interface BackendArtifact {
  artifact_id?: string;
  artifact_type?: string;
  question?: string;
  period?: string;
  source_views?: string[] | null;
  freshness?: BackendFreshness | null;
  summary?: string;
  data?: Record<string, unknown>[] | null;
  chart_spec?: BackendChartSpec | null;
  actions?: BackendActionItem[] | null;
  citations?: BackendCitation[] | null;
  warnings?: string[] | null;
  trace_id?: string | null;
  [key: string]: unknown;
}

export interface BackendChatResponse {
  answer: string;
  citations?: BackendCitation[] | null;
  suggested_questions?: string[] | null;
  artifacts?: BackendArtifact[] | null;
  warnings?: string[] | null;
  trace_id?: string | null;
  conversation_id?: string | null;
  [key: string]: unknown;
}
