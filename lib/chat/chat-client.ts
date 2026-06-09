import { chatStrings } from '@/lib/chat/strings';

import type {
  BackendChatResponse,
  BackendCitation,
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
    suggestedQuestions: (data.suggested_questions ?? []).filter(
      (question): question is string => typeof question === 'string'
    ),
    warnings: (data.warnings ?? []).filter(
      (warning): warning is string => typeof warning === 'string'
    ),
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
