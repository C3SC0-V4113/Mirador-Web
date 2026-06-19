import { beforeEach, describe, expect, it } from 'vitest';

import { useChatStore } from '@/lib/chat/store';

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

describe('chat store messages slice', () => {
  beforeEach(() => {
    resetStore();
  });

  it('appends a user message and a pending assistant message', () => {
    useChatStore.getState().appendUserAndPendingAssistant({
      userMessageId: 'user-1',
      assistantMessageId: 'assistant-1',
      userMessage: 'Hola',
    });

    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: 'user', content: 'Hola', status: 'complete' });
    expect(messages[1]).toMatchObject({ role: 'assistant', content: '', status: 'pending' });
  });

  it('completes the assistant message with answer, citations and suggestions', () => {
    const store = useChatStore.getState();
    store.appendUserAndPendingAssistant({
      userMessageId: 'user-1',
      assistantMessageId: 'assistant-1',
      userMessage: 'Hola',
    });

    store.completeAssistant({
      assistantMessageId: 'assistant-1',
      answer: 'Respuesta',
      citations: [{ documentId: 'd1', title: 'Doc', locator: 'p.1', snippet: '...' }],
      suggestedQuestions: ['¿Y el MRR?'],
      artifacts: [{ artifactId: 'art-1', artifactType: 'kpi', data: [{ mrr: 100 }] }],
      warnings: ['Datos parciales'],
      traceId: 'trace-123',
    });

    const assistant = useChatStore.getState().messages[1];
    expect(assistant).toMatchObject({ content: 'Respuesta', status: 'complete' });
    expect(assistant.kind === 'message' && assistant.citations).toHaveLength(1);
    expect(assistant.kind === 'message' && assistant.suggestedQuestions).toEqual(['¿Y el MRR?']);
    expect(assistant.kind === 'message' && assistant.artifacts).toHaveLength(1);
    expect(assistant.kind === 'message' && assistant.warnings).toEqual(['Datos parciales']);
    expect(assistant.kind === 'message' && assistant.traceId).toBe('trace-123');
  });

  it('marks the assistant message interrupted and keeps its content', () => {
    const store = useChatStore.getState();
    store.appendUserAndPendingAssistant({
      userMessageId: 'user-1',
      assistantMessageId: 'assistant-1',
      userMessage: 'Hola',
    });
    store.setAssistantContent({ assistantMessageId: 'assistant-1', content: 'Parcial' });
    store.interruptedAssistant({ assistantMessageId: 'assistant-1', retryPrompt: 'Hola' });

    const assistant = useChatStore.getState().messages[1];
    expect(assistant).toMatchObject({
      content: 'Parcial',
      status: 'interrupted',
      retryPrompt: 'Hola',
    });
  });

  it('appends an error bubble and removes only error bubbles', () => {
    const store = useChatStore.getState();
    store.appendUserAndPendingAssistant({
      userMessageId: 'user-1',
      assistantMessageId: 'assistant-1',
      userMessage: 'Hola',
    });
    store.appendError({ message: 'Falló', retryPrompt: 'Hola' });
    expect(useChatStore.getState().messages.some((message) => message.kind === 'error')).toBe(true);

    store.removeErrors();
    const { messages } = useChatStore.getState();
    expect(messages.some((message) => message.kind === 'error')).toBe(false);
    expect(messages).toHaveLength(2);
  });

  it('clears all messages and the last failed request', () => {
    const store = useChatStore.getState();
    store.appendUserAndPendingAssistant({
      userMessageId: 'user-1',
      assistantMessageId: 'assistant-1',
      userMessage: 'Hola',
    });
    store.setLastFailedRequest({ prompt: 'Hola', intentMode: 'analizar' });

    store.clearAll();
    expect(useChatStore.getState().messages).toHaveLength(0);
    expect(useChatStore.getState().lastFailedRequest).toBeNull();
  });
});
