import type { ChatStore } from '@/lib/chat/store';
import type {
  ChartSpec,
  ChatArtifact,
  Citation,
  ChatRetryRequest,
  ChatUiMessage,
  DynamicChartSpec,
} from '@/lib/chat/types';
import type { StateCreator } from 'zustand';

export interface MessagesSlice {
  messages: ChatUiMessage[];
  lastFailedRequest: ChatRetryRequest | null;

  appendUserAndPendingAssistant: (input: {
    userMessageId: string;
    assistantMessageId: string;
    userMessage: string;
  }) => void;
  setAssistantContent: (input: { assistantMessageId: string; content: string }) => void;
  completeAssistant: (input: {
    assistantMessageId: string;
    answer: string;
    citations: Citation[];
    suggestedQuestions: string[];
    artifacts: ChatArtifact[];
    warnings: string[];
    traceId: string | null;
  }) => void;
  interruptedAssistant: (input: { assistantMessageId: string; retryPrompt: string }) => void;
  updateArtifactChartSpec: (input: { artifactId: string; chartSpec: ChartSpec }) => void;
  updateArtifactDynamicChartSpec: (input: {
    artifactId: string;
    chartSpec: DynamicChartSpec;
  }) => void;
  removeMessage: (messageId: string) => void;
  appendError: (input: { message: string; retryPrompt?: string }) => void;
  removeErrors: () => void;
  clearAll: () => void;
  hydrate: (messages: ChatUiMessage[]) => void;
  setLastFailedRequest: (request: ChatRetryRequest | null) => void;
}

export const createMessagesSlice: StateCreator<ChatStore, [], [], MessagesSlice> = (set) => ({
  messages: [],
  lastFailedRequest: null,

  appendUserAndPendingAssistant: ({ userMessageId, assistantMessageId, userMessage }) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          kind: 'message',
          id: userMessageId,
          role: 'user',
          content: userMessage,
          status: 'complete',
        },
        {
          kind: 'message',
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          status: 'pending',
        },
      ],
    })),

  setAssistantContent: ({ assistantMessageId, content }) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === assistantMessageId && message.kind === 'message'
          ? { ...message, content }
          : message
      ),
    })),

  completeAssistant: ({
    assistantMessageId,
    answer,
    citations,
    suggestedQuestions,
    artifacts,
    warnings,
    traceId,
  }) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === assistantMessageId && message.kind === 'message'
          ? {
              ...message,
              content: answer,
              status: 'complete',
              citations: citations.length > 0 ? citations : undefined,
              suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined,
              artifacts: artifacts.length > 0 ? artifacts : undefined,
              warnings: warnings.length > 0 ? warnings : undefined,
              traceId: traceId ?? undefined,
            }
          : message
      ),
    })),

  interruptedAssistant: ({ assistantMessageId, retryPrompt }) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === assistantMessageId && message.kind === 'message'
          ? { ...message, status: 'interrupted', retryPrompt }
          : message
      ),
    })),

  updateArtifactChartSpec: ({ artifactId, chartSpec }) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.kind === 'message' &&
        message.artifacts?.some((artifact) => artifact.artifactId === artifactId)
          ? {
              ...message,
              artifacts: message.artifacts.map((artifact) =>
                artifact.artifactId === artifactId ? { ...artifact, chartSpec } : artifact
              ),
            }
          : message
      ),
    })),

  updateArtifactDynamicChartSpec: ({ artifactId, chartSpec }) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.kind === 'message' &&
        message.artifacts?.some((artifact) => artifact.artifactId === artifactId)
          ? {
              ...message,
              artifacts: message.artifacts.map((artifact) =>
                artifact.artifactId === artifactId
                  ? {
                      ...artifact,
                      artifactType: 'dynamic_chart',
                      chartSpec: undefined,
                      dynamicChartSpec: chartSpec,
                    }
                  : artifact
              ),
            }
          : message
      ),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((message) => message.id !== messageId),
    })),

  appendError: ({ message, retryPrompt }) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          kind: 'error',
          id: crypto.randomUUID(),
          role: 'system',
          content: message,
          status: 'error',
          retryPrompt,
        },
      ],
    })),

  removeErrors: () =>
    set((state) => ({
      messages: state.messages.filter((message) => message.kind !== 'error'),
    })),

  clearAll: () => set({ messages: [], lastFailedRequest: null }),

  hydrate: (messages) => set({ messages }),

  setLastFailedRequest: (request) => set({ lastFailedRequest: request }),
});
