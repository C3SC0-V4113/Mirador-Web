'use client';

import { GitCompareArrows, Lightbulb, TrendingUp } from 'lucide-react';

import { useChatRuntime } from '@/components/chat/chat-runtime-provider';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';

import type { LucideIcon } from 'lucide-react';

type QuickActionId = (typeof chatStrings.quickActions.actions)[number]['id'];

const ACTION_ICONS: Record<QuickActionId, LucideIcon> = {
  compare: GitCompareArrows,
  explain: Lightbulb,
  forecast: TrendingUp,
};

/**
 * Contextual quick actions shown under the latest assistant answer. Each sends a
 * templated follow-up through the shared chat runtime. (Context is the current
 * conversation for now; once artifacts land these can carry `context_artifact_id`.)
 */
export function QuickActions() {
  const { sendMessage } = useChatRuntime();

  const handleRun = (prompt: string) => {
    useChatStore.getState().setInput(prompt);
    void sendMessage();
  };

  return (
    <div className="flex flex-wrap gap-1.5" aria-label={chatStrings.quickActions.title}>
      {chatStrings.quickActions.actions.map((action) => {
        const Icon = ACTION_ICONS[action.id];

        return (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleRun(action.prompt)}
          >
            <Icon data-icon="inline-start" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
