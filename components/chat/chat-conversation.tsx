'use client';

import { useEffect } from 'react';

import { ChatMessagesView } from '@/components/chat/chat-messages-view';
import { useChatStore } from '@/lib/chat/store';

import type { ChatUiMessage } from '@/lib/chat/types';

interface ChatConversationProps {
  conversationId: string | null;
  initialMessages: ChatUiMessage[];
}

/**
 * Seeds the chat store from server-fetched data for the current route. The store
 * is the single source of truth for live messages; this only syncs it when the
 * route points at a DIFFERENT conversation than the one already loaded — so a
 * `router.refresh()` (e.g. after a rename) or the post-send navigation never
 * clobbers the in-flight live thread.
 */
export function ChatConversation({ conversationId, initialMessages }: ChatConversationProps) {
  // Genuine external-store sync: seed the Zustand store from server-provided
  // route data when the route points at a different conversation. Not derivable
  // during render (the store is non-React external state).
  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler */
  useEffect(() => {
    const store = useChatStore.getState();

    if (store.activeConversationId === conversationId) {
      return;
    }

    store.hydrate(initialMessages);
    store.setActiveConversationId(conversationId);
    store.setErrorMessage('');
    store.setLastFailedRequest(null);
  }, [conversationId, initialMessages]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  return <ChatMessagesView />;
}
