'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';

const FEEDBACK_MS = 1500;

interface CopyTraceButtonProps {
  traceId: string;
  label: string;
}

/**
 * Copyable `trace_id` affordance — surfaced everywhere a response or artifact
 * carries one, per ADR-0005 (trace must be visible or retrievable).
 */
export function CopyTraceButton({ traceId, label }: CopyTraceButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(traceId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), FEEDBACK_MS);
    } catch {
      useChatStore.getState().setErrorMessage(chatStrings.errors.copyFailed);
    }
  };

  const tooltip = isCopied ? chatStrings.artifacts.traceCopied : chatStrings.artifacts.copyTrace;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={tooltip}
            onClick={() => {
              void handleCopy();
            }}
            className="inline-flex max-w-full items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {isCopied ? (
              <Check className="size-3 shrink-0" aria-hidden />
            ) : (
              <Copy className="size-3 shrink-0" aria-hidden />
            )}
            <span className="truncate font-mono">
              {label}: {traceId}
            </span>
          </button>
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
