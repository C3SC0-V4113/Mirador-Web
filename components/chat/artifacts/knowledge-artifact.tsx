import { ChatMarkdown } from '@/components/chat/chat-markdown';
import { CitationList } from '@/components/chat/citation-list';
import { chatStrings } from '@/lib/chat/strings';

import type { ChatArtifact } from '@/lib/chat/types';

/** Document-grounded narrative rendered with its citations (ADR-0005). */
export function KnowledgeArtifact({ artifact }: { artifact: ChatArtifact }) {
  const citations = artifact.citations ?? [];

  return (
    <div className="flex flex-col gap-3">
      {artifact.summary ? <ChatMarkdown content={artifact.summary} /> : null}
      {citations.length > 0 ? (
        <CitationList citations={citations} title={chatStrings.artifacts.citationsTitle} />
      ) : null}
    </div>
  );
}
