'use client';

import { Check, Copy, RotateCcw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import * as ChatBubble from '@/components/chat/chat-bubble';
import { ChatMarkdown } from '@/components/chat/chat-markdown';
import { useChatRuntime } from '@/components/chat/chat-runtime-provider';
import { QuickActions } from '@/components/chat/quick-actions';
import { SuggestionPills } from '@/components/chat/suggestion-pills';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';

import type { Citation } from '@/lib/chat/types';

interface AssistantBubbleProps {
  messageId: string;
  text: string;
  status: 'pending' | 'complete' | 'interrupted';
  citations?: Citation[];
  suggestedQuestions?: string[];
  warnings?: string[];
  traceId?: string | null;
  retryPrompt?: string;
  isLastAssistant?: boolean;
}

const strings = chatStrings.message;
const TRACE_COPIED_FEEDBACK_MS = 1500;

export function AssistantBubble({
  messageId,
  text,
  status,
  citations,
  suggestedQuestions,
  warnings,
  traceId,
  retryPrompt,
  isLastAssistant,
}: AssistantBubbleProps) {
  const isCopied = useChatStore((state) => state.copiedMessageId === messageId);
  const { copyMessageText, retryLastFailedPrompt } = useChatRuntime();
  const [isTraceCopied, setIsTraceCopied] = useState(false);

  const handleCopyTrace = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setIsTraceCopied(true);
      setTimeout(() => setIsTraceCopied(false), TRACE_COPIED_FEEDBACK_MS);
    } catch {
      useChatStore.getState().setErrorMessage(chatStrings.errors.copyFailed);
    }
  };

  return (
    <ChatBubble.Root author="assistant" state={status}>
      <ChatBubble.Header>{strings.assistant}</ChatBubble.Header>

      <ChatBubble.Body>
        {status === 'pending' && !text ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Spinner />
            {strings.thinking}
          </p>
        ) : status === 'complete' ? (
          <ChatMarkdown content={text} />
        ) : (
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{text}</p>
        )}
      </ChatBubble.Body>

      {warnings && warnings.length > 0 ? (
        <section
          className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive"
          aria-label={strings.warningsTitle}
        >
          <p className="mb-1 text-xs font-medium">{strings.warningsTitle}</p>
          <ul className="flex flex-col gap-1 text-xs">
            {warnings.map((warning) => (
              <li key={warning} className="flex items-start gap-1.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {citations && citations.length > 0 ? (
        <section className="mt-3" aria-label={strings.citationsTitle}>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            {strings.citationsTitle}
          </p>
          <ul className="flex flex-col gap-1.5">
            {citations.map((citation) => (
              <li key={`${citation.documentId}-${citation.locator}`}>
                <Badge variant="outline" className="h-auto items-start gap-1 px-2 py-1 text-left">
                  <span className="font-medium">{citation.title}</span>
                  <span className="text-muted-foreground">· {citation.locator}</span>
                </Badge>
                <p className="mt-0.5 pl-2 text-xs text-muted-foreground">{citation.snippet}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {suggestedQuestions && suggestedQuestions.length > 0 ? (
        <section className="mt-3" aria-label={strings.suggestedTitle}>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            {strings.suggestedTitle}
          </p>
          <SuggestionPills questions={suggestedQuestions} aria-label={strings.suggestedTitle} />
        </section>
      ) : null}

      {isLastAssistant && status === 'complete' && text.trim() ? (
        <section className="mt-3" aria-label={chatStrings.quickActions.title}>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            {chatStrings.quickActions.title}
          </p>
          <QuickActions />
        </section>
      ) : null}

      {status === 'complete' && text.trim() ? (
        <ChatBubble.Footer>
          {traceId ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={isTraceCopied ? strings.traceCopied : strings.copyTrace}
                    onClick={() => {
                      void handleCopyTrace(traceId);
                    }}
                    className="inline-flex max-w-[60%] items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {isTraceCopied ? (
                      <Check className="size-3 shrink-0" aria-hidden />
                    ) : (
                      <Copy className="size-3 shrink-0" aria-hidden />
                    )}
                    <span className="truncate font-mono">
                      {strings.traceLabel}: {traceId}
                    </span>
                  </button>
                }
              />
              <TooltipContent>
                {isTraceCopied ? strings.traceCopied : strings.copyTrace}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="sr-only">{strings.assistant}</span>
          )}
          <ChatBubble.Actions>
            <Tooltip>
              <TooltipTrigger
                render={
                  <ChatBubble.Action
                    aria-label={isCopied ? strings.copied : strings.copy}
                    variant={isCopied ? 'secondary' : 'ghost'}
                    onClick={() => {
                      void copyMessageText(messageId, text);
                    }}
                  >
                    {isCopied ? <Check /> : <Copy />}
                  </ChatBubble.Action>
                }
              />
              <TooltipContent>{isCopied ? strings.copied : strings.copy}</TooltipContent>
            </Tooltip>
          </ChatBubble.Actions>
        </ChatBubble.Footer>
      ) : status === 'interrupted' ? (
        <ChatBubble.Footer>
          <span>{strings.interrupted}</span>
          {retryPrompt ? (
            <ChatBubble.Actions>
              <ChatBubble.Action
                variant="secondary"
                onClick={() => {
                  void retryLastFailedPrompt();
                }}
              >
                <RotateCcw data-icon="inline-start" />
                {strings.retry}
              </ChatBubble.Action>
            </ChatBubble.Actions>
          ) : null}
        </ChatBubble.Footer>
      ) : null}
    </ChatBubble.Root>
  );
}
