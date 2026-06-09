import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { ChatRuntimeProvider } from '@/components/chat/chat-runtime-provider';
import { sendChatMessage } from '@/lib/chat/chat-client';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';

vi.mock('@/lib/chat/chat-client', () => ({
  sendChatMessage: vi.fn(),
}));

const sendChatMessageMock = vi.mocked(sendChatMessage);

function resetStore() {
  useChatStore.setState({
    messages: [],
    lastFailedRequest: null,
    input: '',
    intentMode: 'responder',
    isSubmitting: false,
    pendingAssistantMessageId: null,
    copiedMessageId: null,
    errorMessage: '',
  });
}

describe('ChatEmptyState', () => {
  beforeEach(() => {
    resetStore();
    sendChatMessageMock.mockReset();
    sendChatMessageMock.mockResolvedValue({
      answer: 'ok',
      citations: [],
      suggestedQuestions: [],
      warnings: [],
      traceId: null,
    });
  });

  it('renders the starter suggestions', () => {
    render(
      <ChatRuntimeProvider>
        <ChatEmptyState />
      </ChatRuntimeProvider>
    );

    for (const suggestion of chatStrings.emptyState.suggestions) {
      expect(screen.getByRole('button', { name: suggestion })).toBeDefined();
    }
  });

  it('sends the starter question when a pill is clicked', async () => {
    render(
      <ChatRuntimeProvider>
        <ChatEmptyState />
      </ChatRuntimeProvider>
    );

    const [firstSuggestion] = chatStrings.emptyState.suggestions;

    fireEvent.click(screen.getByRole('button', { name: firstSuggestion }));

    await waitFor(() => {
      expect(sendChatMessageMock).toHaveBeenCalledWith(
        { content: firstSuggestion, intentMode: 'responder' },
        expect.any(AbortSignal)
      );
    });
  });
});
