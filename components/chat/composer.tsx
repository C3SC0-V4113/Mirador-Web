'use client';

import { ArrowUp, Square } from 'lucide-react';
import { type KeyboardEvent } from 'react';

import { useChatRuntime } from '@/components/chat/chat-runtime-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';
import { CHAT_INTENT_MODES } from '@/lib/chat/types';

import type { ChatIntentMode } from '@/lib/chat/types';

const strings = chatStrings.composer;

export function Composer() {
  const input = useChatStore((state) => state.input);
  const intentMode = useChatStore((state) => state.intentMode);
  const isSubmitting = useChatStore((state) => state.isSubmitting);
  const setInput = useChatStore((state) => state.setInput);
  const setIntentMode = useChatStore((state) => state.setIntentMode);

  const { sendMessage, stopGeneration } = useChatRuntime();

  const canSend = input.trim().length > 0 && !isSubmitting;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        void sendMessage();
      }
    }
  };

  return (
    <div className="shrink-0 border-t bg-background p-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <ToggleGroup
          value={[intentMode]}
          onValueChange={(value: string[]) => {
            const next = value[0] as ChatIntentMode | undefined;
            if (next) {
              setIntentMode(next);
            }
          }}
          variant="outline"
          size="sm"
          aria-label={strings.intentLabel}
        >
          {CHAT_INTENT_MODES.map((mode) => (
            <ToggleGroupItem
              key={mode}
              value={mode}
              aria-label={chatStrings.intentModes[mode].label}
              title={chatStrings.intentModes[mode].description}
            >
              {chatStrings.intentModes[mode].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-end gap-2">
          <Textarea
            aria-label={strings.ariaLabel}
            placeholder={strings.placeholder}
            className="max-h-40"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
            onKeyDown={handleKeyDown}
          />

          {isSubmitting ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label={strings.stop}
                    onClick={stopGeneration}
                  >
                    <Square />
                  </Button>
                }
              />
              <TooltipContent>{strings.stop}</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon"
                    aria-label={strings.send}
                    disabled={!canSend}
                    onClick={() => {
                      void sendMessage();
                    }}
                  >
                    <ArrowUp />
                  </Button>
                }
              />
              <TooltipContent>{strings.send}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
