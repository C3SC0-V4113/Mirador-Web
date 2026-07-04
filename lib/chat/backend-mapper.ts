import type { BackendArtifact, BackendChatResponse } from '@/lib/chat/types';

/**
 * Anti-Corruption Layer between `mirador-core` and the frontend.
 *
 * `mirador-core` returns a different shape than the contract the chat UI was
 * built against (`lib/chat/chat-client.ts` normalizes `Backend*`). Rather than
 * touching the React/store/components layers, the BFF route handlers map the
 * real backend response into the expected `BackendChatResponse` here.
 *
 * Backend → Frontend deltas handled:
 * - `message`            → `answer`
 * - artifact `id`        → `artifact_id`
 * - artifact `type`      → `artifact_type` (UPPERCASE → lowercase)
 * - `payload.rows`       → `data`
 * - `payload.actions`    → `actions`
 * - `chart_spec`         → passed through (`y: string` is handled downstream)
 * - `metadata.source_views` → per-artifact `source_views`
 * - `conversation_id`    → carried through for multi-turn continuity
 */

/** Artifact as returned by `mirador-core` (`ChatArtifactView`). */
interface CoreArtifact {
  id?: unknown;
  type?: unknown;
  summary?: unknown;
  payload?: unknown;
  chart_spec?: unknown;
  sandbox_html?: unknown;
  sandbox_metadata?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Single-pass: filter record-shaped items and map them in one traversal. */
function mapRecords<T>(value: unknown, fn: (record: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: T[] = [];

  for (const item of value) {
    if (isRecord(item)) {
      result.push(fn(item));
    }
  }

  return result;
}

function asRows(value: unknown): Record<string, unknown>[] | undefined {
  const rows = mapRecords(value, (record) => record);
  return rows.length > 0 ? rows : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items: string[] = [];

  for (const item of value) {
    if (typeof item === 'string') {
      items.push(item);
    }
  }

  return items.length > 0 ? items : undefined;
}

function mapArtifact(artifact: CoreArtifact, sourceViews?: string[]): BackendArtifact {
  const payload = isRecord(artifact.payload) ? artifact.payload : undefined;
  const type = typeof artifact.type === 'string' ? artifact.type.toLowerCase() : 'text';

  return {
    artifact_id: typeof artifact.id === 'string' ? artifact.id : undefined,
    artifact_type: type,
    summary: typeof artifact.summary === 'string' ? artifact.summary : undefined,
    source_views: sourceViews,
    data: payload ? asRows(payload.rows) : undefined,
    labels: payload && isRecord(payload.labels) ? asStringRecord(payload.labels) : undefined,
    actions: payload ? mapActions(payload.actions) : undefined,
    chart_spec: isRecord(artifact.chart_spec) ? artifact.chart_spec : undefined,
    sandbox_html: typeof artifact.sandbox_html === 'string' ? artifact.sandbox_html : undefined,
    sandbox_metadata: mapSandboxMetadata(artifact.sandbox_metadata),
  };
}

function mapSandboxMetadata(value: unknown): BackendArtifact['sandbox_metadata'] {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    external_resources: asStringArray(value.external_resources) ?? [],
    blocked_items: asStringArray(value.blocked_items) ?? [],
  };
}

function asStringRecord(value: Record<string, unknown>): Record<string, string> | undefined {
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function mapActions(actions: unknown): BackendArtifact['actions'] {
  const mapped = mapRecords(actions, (action) => ({
    title: typeof action.title === 'string' ? action.title : '',
    detail: typeof action.detail === 'string' ? action.detail : undefined,
    kind: typeof action.kind === 'string' ? action.kind : undefined,
  }));

  return mapped.length > 0 ? mapped : undefined;
}

/**
 * Maps a raw `mirador-core` chat response into the `BackendChatResponse` the
 * frontend `chat-client` already knows how to normalize.
 */
export function toFrontendChatResponse(raw: unknown): BackendChatResponse {
  const response = isRecord(raw) ? raw : {};
  const metadata = isRecord(response.metadata) ? response.metadata : undefined;
  const sourceViews = asStringArray(metadata?.source_views);

  return {
    answer: typeof response.message === 'string' ? response.message : '',
    citations: [],
    suggested_questions: asStringArray(response.suggested_questions) ?? [],
    artifacts: mapRecords(response.artifacts, (artifact) => mapArtifact(artifact, sourceViews)),
    warnings: asStringArray(response.warnings) ?? [],
    trace_id: typeof response.trace_id === 'string' ? response.trace_id : null,
    conversation_id: typeof response.conversation_id === 'string' ? response.conversation_id : null,
  };
}

/** One past message in the snake_case contract the chat client normalizes. */
export interface FrontendConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  trace_id: string | null;
  warnings: string[];
  artifacts: BackendArtifact[];
}

export interface FrontendConversationDetail {
  conversation_id: string;
  messages: FrontendConversationMessage[];
}

function mapConversationMessage(message: Record<string, unknown>): FrontendConversationMessage {
  return {
    id: typeof message.id === 'string' ? message.id : '',
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: typeof message.content === 'string' ? message.content : '',
    trace_id: typeof message.trace_id === 'string' ? message.trace_id : null,
    warnings: asStringArray(message.warnings) ?? [],
    artifacts: mapRecords(message.artifacts, (artifact) => mapArtifact(artifact)),
  };
}

/**
 * Maps a raw `mirador-core` conversation detail into the snake_case shape the
 * chat client normalizes when rehydrating a past conversation. The backend's
 * `ChatArtifactView` is the same shape `mapArtifact` already consumes, so the
 * artifact mapping is reused verbatim.
 */
export function toFrontendConversationDetail(raw: unknown): FrontendConversationDetail {
  const detail = isRecord(raw) ? raw : {};

  return {
    conversation_id: typeof detail.conversation_id === 'string' ? detail.conversation_id : '',
    messages: mapRecords(detail.messages, mapConversationMessage),
  };
}
