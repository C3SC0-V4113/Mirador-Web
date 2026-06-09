'use client';

import { RotateCcw } from 'lucide-react';

import * as ChatBubble from '@/components/chat/chat-bubble';
import { useChatRuntime } from '@/components/chat/chat-runtime-provider';
import { chatStrings } from '@/lib/chat/strings';

interface ErrorBubbleProps {
  text: string;
  retryPrompt?: string;
}

const strings = chatStrings.message;

export function ErrorBubble({ text, retryPrompt }: ErrorBubbleProps) {
  const { retryLastFailedPrompt } = useChatRuntime();

  return (
    <ChatBubble.Root author="system" state="error">
      <ChatBubble.Body>{text}</ChatBubble.Body>
      {retryPrompt ? (
        <ChatBubble.Footer>
          <ChatBubble.Actions>
            <ChatBubble.Action
              variant="destructive"
              onClick={() => {
                void retryLastFailedPrompt();
              }}
            >
              <RotateCcw data-icon="inline-start" />
              {strings.retry}
            </ChatBubble.Action>
          </ChatBubble.Actions>
        </ChatBubble.Footer>
      ) : null}
    </ChatBubble.Root>
  );
}
