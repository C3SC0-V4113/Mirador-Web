'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { sendChatMessage } from '@/lib/chat/chat-client';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';

import type { ChatIntentMode } from '@/lib/chat/types';

const COPIED_FEEDBACK_MS = 1500;

/**
 * Owns the imperative side of the chat (network, abort, copy timeouts) and
 * drives the Zustand store. Slim replacement for `other-gpt`'s stream + clipboard
 * effect hooks — non-streaming: optimistic pending bubble → await JSON → complete
 * or error. Mount once (in `ChatRuntimeProvider`) so the refs are stable.
 */
export function useChatController() {
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualStopRef = useRef(false);

  async function runRequest(
    prompt: string,
    intentMode: ChatIntentMode,
    options?: { clearComposer?: boolean }
  ) {
    const trimmed = prompt.trim();
    const store = useChatStore.getState();

    if (!trimmed || store.isSubmitting) {
      return;
    }

    if (options?.clearComposer) {
      store.setInput('');
    }

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    manualStopRef.current = false;

    store.setErrorMessage('');
    store.setSubmitting(true);
    store.setPendingAssistantMessageId(assistantMessageId);
    store.appendUserAndPendingAssistant({
      userMessageId,
      assistantMessageId,
      userMessage: trimmed,
    });

    const previousConversationId = store.activeConversationId;

    try {
      const response = await sendChatMessage(
        { content: trimmed, intentMode, conversationId: previousConversationId ?? undefined },
        controller.signal
      );

      const settled = useChatStore.getState();
      // Thread the conversation so the next turn continues the same backend
      // thread instead of starting a new one.
      if (response.conversationId) {
        settled.setActiveConversationId(response.conversationId);

        // First turn of a brand-new conversation: move to its route and refresh
        // the server-rendered sidebar so it appears there. The hydrator skips
        // re-seeding because the store is already on this conversation.
        if (previousConversationId === null) {
          router.replace(`/chat/${response.conversationId}`);
          router.refresh();
        }
      }
      settled.completeAssistant({
        assistantMessageId,
        answer: response.answer,
        citations: response.citations,
        suggestedQuestions: response.suggestedQuestions,
        artifacts: response.artifacts,
        warnings: response.warnings,
        traceId: response.traceId,
      });
      settled.setLastFailedRequest(null);
    } catch (error) {
      const current = useChatStore.getState();

      if (error instanceof DOMException && error.name === 'AbortError') {
        if (manualStopRef.current) {
          current.interruptedAssistant({ assistantMessageId, retryPrompt: trimmed });
          current.setLastFailedRequest({ prompt: trimmed, intentMode });
        } else {
          current.removeMessage(assistantMessageId);
        }
        return;
      }

      const message = error instanceof Error ? error.message : chatStrings.errors.requestFailed;
      current.removeMessage(assistantMessageId);
      current.setErrorMessage(message);
      current.setLastFailedRequest({ prompt: trimmed, intentMode });
      current.appendError({ message, retryPrompt: trimmed });
    } finally {
      abortControllerRef.current = null;
      manualStopRef.current = false;
      const settled = useChatStore.getState();
      settled.setPendingAssistantMessageId(null);
      settled.setSubmitting(false);
    }
  }

  async function sendMessage() {
    const { input, intentMode } = useChatStore.getState();
    await runRequest(input, intentMode, { clearComposer: true });
  }

  function stopGeneration() {
    const controller = abortControllerRef.current;
    if (!controller) {
      return;
    }
    manualStopRef.current = true;
    controller.abort();
    abortControllerRef.current = null;
    useChatStore.getState().setSubmitting(false);
  }

  async function retryLastFailedPrompt() {
    const store = useChatStore.getState();
    const lastFailedRequest = store.lastFailedRequest;

    if (!lastFailedRequest || store.isSubmitting) {
      return;
    }

    store.removeErrors();
    await runRequest(lastFailedRequest.prompt, lastFailedRequest.intentMode);
  }

  async function copyMessageText(messageId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      useChatStore.getState().setCopied(messageId);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        useChatStore.getState().setCopied(null);
        copyTimeoutRef.current = null;
      }, COPIED_FEEDBACK_MS);
    } catch {
      useChatStore.getState().setErrorMessage(chatStrings.errors.copyFailed);
    }
  }

  useEffect(() => {
    const abortControllerRefValue = abortControllerRef;
    const copyTimeoutRefValue = copyTimeoutRef;

    return () => {
      abortControllerRefValue.current?.abort();
      abortControllerRefValue.current = null;
      if (copyTimeoutRefValue.current) {
        clearTimeout(copyTimeoutRefValue.current);
        copyTimeoutRefValue.current = null;
      }
    };
  }, []);

  return { sendMessage, stopGeneration, retryLastFailedPrompt, copyMessageText };
}
