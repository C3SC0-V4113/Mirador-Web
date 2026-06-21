'use client';

import { fetchConversationDetail, fetchConversations } from '@/lib/chat/chat-client';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';

/**
 * Conversation history actions against the BFF and the store. Module-scope pure
 * functions (no hooks, no local state) — they read/write the store via
 * `getState()`, so the UI can call them directly without re-creating closures.
 */
export async function loadConversations() {
  const store = useChatStore.getState();
  store.setLoadingConversations(true);

  try {
    const conversations = await fetchConversations();
    useChatStore.getState().setConversations(conversations);
  } catch (error) {
    useChatStore
      .getState()
      .setErrorMessage(error instanceof Error ? error.message : chatStrings.errors.requestFailed);
  } finally {
    useChatStore.getState().setLoadingConversations(false);
  }
}

export async function openConversation(conversationId: string) {
  const store = useChatStore.getState();

  if (store.isLoadingConversation) {
    return;
  }

  store.setLoadingConversation(true);

  try {
    const detail = await fetchConversationDetail(conversationId);
    const next = useChatStore.getState();
    next.hydrate(detail.messages);
    next.setActiveConversationId(detail.conversationId || conversationId);
    next.setLastFailedRequest(null);
    next.setErrorMessage('');
  } catch (error) {
    useChatStore
      .getState()
      .setErrorMessage(error instanceof Error ? error.message : chatStrings.errors.requestFailed);
  } finally {
    useChatStore.getState().setLoadingConversation(false);
  }
}

export function startNewConversation() {
  const store = useChatStore.getState();
  store.clearAll();
  store.setActiveConversationId(null);
  store.setErrorMessage('');
}
