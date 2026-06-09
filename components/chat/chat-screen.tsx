'use client';

import { ChatMessagesView } from '@/components/chat/chat-messages-view';

/**
 * Client entry rendered by the chat page. Keeps the page a thin server
 * component while the message list reads the global chat store.
 */
export function ChatScreen() {
  return <ChatMessagesView />;
}
