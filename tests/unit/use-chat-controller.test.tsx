import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatController } from '@/components/chat/use-chat-controller';
import { sendChatMessage } from '@/lib/chat/chat-client';
import { useChatStore } from '@/lib/chat/store';

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
    activeConversationId: null,
  });
}

describe('useChatController', () => {
  beforeEach(() => {
    resetStore();
    sendChatMessageMock.mockReset();
  });

  it('sends the composer input and completes the assistant message', async () => {
    sendChatMessageMock.mockResolvedValue({
      answer: 'Respuesta del backend',
      citations: [],
      suggestedQuestions: ['¿Siguiente pregunta?'],
      artifacts: [],
      warnings: [],
      traceId: 'trace-1',
      conversationId: 'conv-1',
    });

    const { result } = renderHook(() => useChatController());
    useChatStore.getState().setInput('¿Cómo va el MRR?');

    await act(async () => {
      await result.current.sendMessage();
    });

    const { messages, isSubmitting, activeConversationId } = useChatStore.getState();
    expect(sendChatMessageMock).toHaveBeenCalledWith(
      {
        content: '¿Cómo va el MRR?',
        intentMode: 'responder',
        conversationId: undefined,
        dynamicChartsEnabled: false,
      },
      expect.anything()
    );
    // The returned conversation id is threaded for the next turn.
    expect(activeConversationId).toBe('conv-1');
    expect(messages).toHaveLength(2);
    expect(messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Respuesta del backend',
      status: 'complete',
    });
    expect(isSubmitting).toBe(false);
  });

  it('records an error bubble and a retry request when the request fails', async () => {
    sendChatMessageMock.mockRejectedValue(new Error('Boom'));

    const { result } = renderHook(() => useChatController());
    useChatStore.getState().setInput('Pregunta que falla');

    await act(async () => {
      await result.current.sendMessage();
    });

    const { messages, lastFailedRequest } = useChatStore.getState();
    expect(messages.some((message) => message.kind === 'error' && message.content === 'Boom')).toBe(
      true
    );
    expect(lastFailedRequest).toEqual({ prompt: 'Pregunta que falla', intentMode: 'responder' });
  });
});
