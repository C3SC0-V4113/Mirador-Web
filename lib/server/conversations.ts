import { auth } from '@/auth';
import { backendAuthHeaders } from '@/lib/auth/backend-session';
import { toFrontendConversationDetail } from '@/lib/chat/backend-mapper';
import { normalizeConversationSummary, toUiMessage } from '@/lib/chat/chat-client';

import type { ChatUiMessage, ConversationSummary } from '@/lib/chat/types';

/**
 * Server-side conversation data access. Called from Server Components (layout +
 * conversation route), so the list and a thread's history are fetched on the
 * server — no client hook, no extra round-trip. Talks to `mirador-core` directly
 * with the forwarded session cookie (ADR-0003), never exposing it to the browser.
 */

export interface ServerConversationDetail {
  conversationId: string;
  messages: ChatUiMessage[];
}

async function backendFetch(path: string): Promise<Response | null> {
  const apiUrl = process.env.MIRADOR_API_URL;

  if (!apiUrl) {
    return null;
  }

  const session = await auth();
  const headers = backendAuthHeaders(session);

  if (!('Cookie' in headers)) {
    return null;
  }

  try {
    return await fetch(`${apiUrl}${path}`, { cache: 'no-store', headers });
  } catch {
    return null;
  }
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const response = await backendFetch('/api/chat/conversations');

  if (!response || !response.ok) {
    return [];
  }

  const data = (await response.json()) as { conversations?: unknown };
  const list = Array.isArray(data.conversations) ? data.conversations : [];

  return list
    .map(normalizeConversationSummary)
    .filter((summary): summary is ConversationSummary => summary !== null);
}

export async function getConversationDetail(
  conversationId: string
): Promise<ServerConversationDetail | null> {
  const response = await backendFetch(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}`
  );

  if (!response || !response.ok) {
    return null;
  }

  const detail = toFrontendConversationDetail(await response.json());

  return {
    conversationId: detail.conversation_id || conversationId,
    messages: detail.messages.map(toUiMessage),
  };
}
