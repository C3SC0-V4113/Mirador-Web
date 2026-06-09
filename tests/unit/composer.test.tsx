import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ChatRuntimeProvider } from '@/components/chat/chat-runtime-provider';
import { Composer } from '@/components/chat/composer';
import { useChatStore } from '@/lib/chat/store';

function renderComposer() {
  return render(
    <ChatRuntimeProvider>
      <Composer />
    </ChatRuntimeProvider>
  );
}

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

describe('Composer', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the message textarea', () => {
    renderComposer();

    expect(screen.getByLabelText('Escribe tu mensaje')).toBeDefined();
  });

  it('renders the three intent modes', () => {
    renderComposer();

    expect(screen.getByRole('button', { name: 'Responder' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Analizar' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Plan' })).toBeDefined();
  });

  it('updates the store input and enables the send button when typing', () => {
    renderComposer();

    const sendButton = screen.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Escribe tu mensaje'), {
      target: { value: 'Hola Mirador' },
    });

    expect(useChatStore.getState().input).toBe('Hola Mirador');
    expect(sendButton.disabled).toBe(false);
  });
});
