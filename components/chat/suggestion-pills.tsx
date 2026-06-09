'use client';

import { useChatRuntime } from '@/components/chat/chat-runtime-provider';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/lib/chat/store';

interface SuggestionPillsProps {
  questions: readonly string[];
  'aria-label'?: string;
}

/**
 * Clickable suggestion pills shared by the empty-state starters and the
 * per-answer `suggested_questions`. Selecting one fills the composer and sends
 * it through the shared chat runtime.
 */
export function SuggestionPills({ questions, 'aria-label': ariaLabel }: SuggestionPillsProps) {
  const { sendMessage } = useChatRuntime();

  const handleSelect = (question: string) => {
    useChatStore.getState().setInput(question);
    void sendMessage();
  };

  return (
    <div className="flex flex-wrap gap-1.5" aria-label={ariaLabel}>
      {questions.map((question) => (
        <Badge
          key={question}
          variant="secondary"
          className="h-auto cursor-pointer px-2 py-1 whitespace-normal hover:bg-secondary/70"
          render={
            <button type="button" aria-label={question} onClick={() => handleSelect(question)} />
          }
        >
          {question}
        </Badge>
      ))}
    </div>
  );
}
