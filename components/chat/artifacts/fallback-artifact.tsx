import { ChatMarkdown } from '@/components/chat/chat-markdown';
import { chatStrings } from '@/lib/chat/strings';

import type { ChatArtifact } from '@/lib/chat/types';

/** Graceful fallback for unknown/future `artifact_type` values (ADR-0005). */
export function FallbackArtifact({ artifact }: { artifact: ChatArtifact }) {
  return (
    <div className="flex flex-col gap-2">
      {artifact.summary ? <ChatMarkdown content={artifact.summary} /> : null}
      <p className="text-xs text-muted-foreground">{chatStrings.artifacts.fallbackNotice}</p>
    </div>
  );
}
