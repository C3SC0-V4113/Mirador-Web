import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChatRuntimeProvider } from '@/components/chat/chat-runtime-provider';
import { AssistantBubble } from '@/components/chat/message-bubbles/assistant-bubble';

function renderBubble(props: Parameters<typeof AssistantBubble>[0]) {
  return render(
    <ChatRuntimeProvider>
      <AssistantBubble {...props} />
    </ChatRuntimeProvider>
  );
}

describe('AssistantBubble', () => {
  it('renders markdown, citations and suggested questions when complete', () => {
    renderBubble({
      messageId: 'assistant-1',
      text: '**Resumen** del negocio',
      status: 'complete',
      citations: [
        { documentId: 'd1', title: 'Manifiesto 2026', locator: 'pág. 2', snippet: 'Misión...' },
      ],
      suggestedQuestions: ['¿Y el MRR?'],
    });

    expect(screen.getByText('Resumen').tagName).toBe('STRONG');
    expect(screen.getByText('Manifiesto 2026')).toBeDefined();
    expect(screen.getByRole('button', { name: '¿Y el MRR?' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeDefined();
  });

  it('renders data-quality warnings and a copyable trace id when complete', () => {
    renderBubble({
      messageId: 'assistant-1',
      text: 'Respuesta con advertencias',
      status: 'complete',
      warnings: ['Datos parciales: faltan ventas de mayo.'],
      traceId: 'trace-abc-123',
    });

    expect(screen.getByText('Datos parciales: faltan ventas de mayo.')).toBeDefined();
    expect(screen.getByText(/trace-abc-123/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Copiar ID de seguimiento' })).toBeDefined();
  });

  it('shows contextual quick actions on the last complete assistant message', () => {
    renderBubble({
      messageId: 'assistant-1',
      text: 'Respuesta final',
      status: 'complete',
      isLastAssistant: true,
    });

    expect(screen.getByRole('button', { name: 'Comparar' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Explicar' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Pronosticar' })).toBeDefined();
  });

  it('hides quick actions when it is not the last assistant message', () => {
    renderBubble({
      messageId: 'assistant-1',
      text: 'Respuesta intermedia',
      status: 'complete',
      isLastAssistant: false,
    });

    expect(screen.queryByRole('button', { name: 'Comparar' })).toBeNull();
  });

  it('shows the thinking indicator while pending with no content', () => {
    renderBubble({ messageId: 'assistant-1', text: '', status: 'pending' });

    expect(screen.getByText('Mirador está pensando…')).toBeDefined();
  });
});
