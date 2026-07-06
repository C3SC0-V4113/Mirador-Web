'use client';

import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { AssistantBubble } from '@/components/chat/message-bubbles/assistant-bubble';
import { ErrorBubble } from '@/components/chat/message-bubbles/error-bubble';
import { UserBubble } from '@/components/chat/message-bubbles/user-bubble';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import { useChatStore } from '@/lib/chat/store';

import type { ChatUiMessage } from '@/lib/chat/types';

function MessageRow({ message }: { message: ChatUiMessage }) {
  if (message.kind === 'error') {
    return <ErrorBubble text={message.content} retryPrompt={message.retryPrompt} />;
  }

  if (message.role === 'user') {
    return <UserBubble text={message.content} />;
  }

  return (
    <AssistantBubble
      messageId={message.id}
      text={message.content}
      status={message.status === 'error' ? 'interrupted' : message.status}
      citations={message.citations}
      suggestedQuestions={message.suggestedQuestions}
      artifacts={message.artifacts}
      warnings={message.warnings}
      traceId={message.traceId}
      retryPrompt={message.retryPrompt}
    />
  );
}

export function ChatMessagesView() {
  const messages = useChatStore((state) => state.messages);

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <ChatEmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1">
      <MessageScrollerProvider
        autoScroll
        scrollPreviousItemPeek={64}
        defaultScrollPosition="last-anchor"
      >
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-4 px-4 py-6">
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.kind === 'message' && message.role === 'user'}
                >
                  <MessageRow message={message} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}
