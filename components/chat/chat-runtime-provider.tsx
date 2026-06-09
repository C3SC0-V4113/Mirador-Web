'use client';

import { createContext, use, type ReactNode } from 'react';

import { useChatController } from '@/components/chat/use-chat-controller';

type ChatRuntime = ReturnType<typeof useChatController>;

const ChatRuntimeContext = createContext<ChatRuntime | null>(null);

/**
 * Mounts the chat controller once and shares its imperative actions with both
 * the Composer (rendered in the app layout) and the message bubbles (rendered
 * in the page). Reactive state is read directly from the Zustand store; only the
 * action handlers flow through this context.
 */
export function ChatRuntimeProvider({ children }: { children: ReactNode }) {
  const runtime = useChatController();

  return <ChatRuntimeContext.Provider value={runtime}>{children}</ChatRuntimeContext.Provider>;
}

export function useChatRuntime() {
  const context = use(ChatRuntimeContext);

  if (!context) {
    throw new Error('useChatRuntime must be used within ChatRuntimeProvider.');
  }

  return context;
}
