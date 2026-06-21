'use client';

import { GitCompareArrows, Lightbulb, TrendingUp } from 'lucide-react';

import { useChatRuntime } from '@/components/chat/chat-runtime-provider';
import { Button } from '@/components/ui/button';
import { chatStrings } from '@/lib/chat/strings';

import type { LucideIcon } from 'lucide-react';

type QuickActionId = (typeof chatStrings.quickActions.actions)[number]['id'];

const ACTION_ICONS: Record<QuickActionId, LucideIcon> = {
  compare: GitCompareArrows,
  explain: Lightbulb,
  forecast: TrendingUp,
};

interface QuickActionsProps {
  /** Subject of the answer (e.g. the artifact question) so follow-ups carry context. */
  subject?: string;
}

/**
 * Contextual quick actions under the latest assistant answer. Each sends a
 * follow-up that EMBEDS the answer's subject, so the backend planner resolves the
 * same metric instead of replying with a generic clarification.
 */
export function QuickActions({ subject }: QuickActionsProps) {
  const { sendPrompt } = useChatRuntime();

  const handleRun = (prompt: string) => {
    const contextual = subject ? `Sobre "${subject}": ${prompt}` : prompt;
    void sendPrompt(contextual);
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
