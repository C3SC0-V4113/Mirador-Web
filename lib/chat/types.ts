/**
 * Domain types for the Mirador chat surface.
 *
 * These are the frontend's own types — they do not mirror `other-gpt`. The
 * backend contract (snake_case) lives in `BackendChatResponse` and is mapped to
 * the camelCase domain types by `lib/chat/chat-client.ts`. See
 * `docs/architecture/api-contracts.md` and ADR-0005.
 */

/** Composer intent modes shipped in this iteration (ADR-0002 / ADR-0005). */
export type ChatIntentMode = 'responder' | 'analizar' | 'plan';

export const CHAT_INTENT_MODES: readonly ChatIntentMode[] = [
  'responder',
  'analizar',
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
  warnings: string[];
  traceId: string | null;
}

/**
 * Raw backend contract shape (snake_case), as documented in
 * `docs/architecture/api-contracts.md`. Only the fields the UI consumes are
 * typed here; the rest are tolerated.
 */
export interface BackendCitation {
  document_id: string;
  title: string;
  locator: string;
  snippet: string;
}

export interface BackendChatResponse {
  answer: string;
  citations?: BackendCitation[] | null;
  suggested_questions?: string[] | null;
  warnings?: string[] | null;
  trace_id?: string | null;
  [key: string]: unknown;
}
