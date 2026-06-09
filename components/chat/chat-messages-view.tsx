'use client';

import { useEffect, useRef } from 'react';

import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { AssistantBubble } from '@/components/chat/message-bubbles/assistant-bubble';
import { ErrorBubble } from '@/components/chat/message-bubbles/error-bubble';
import { UserBubble } from '@/components/chat/message-bubbles/user-bubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/lib/chat/store';

import type { ChatUiMessage } from '@/lib/chat/types';

function renderMessage(message: ChatUiMessage) {
  if (message.kind === 'error') {
    return (
      <ErrorBubble key={message.id} text={message.content} retryPrompt={message.retryPrompt} />
    );
  }

  if (message.role === 'user') {
    return <UserBubble key={message.id} text={message.content} />;
  }

  return (
    <AssistantBubble
      key={message.id}
      messageId={message.id}
      text={message.content}
      status={message.status === 'error' ? 'interrupted' : message.status}
      citations={message.citations}
      suggestedQuestions={message.suggestedQuestions}
      warnings={message.warnings}
      traceId={message.traceId}
      retryPrompt={message.retryPrompt}
    />
  );
}

export function ChatMessagesView() {
  const messages = useChatStore((state) => state.messages);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = rootRef.current?.querySelector('[data-slot="scroll-area-viewport"]');

    if (viewport instanceof HTMLElement) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <ChatEmptyState />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="min-h-0 flex-1">
      <ScrollArea className="size-full min-h-0">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.map(renderMessage)}
        </div>
      </ScrollArea>
    </div>
  );
}
