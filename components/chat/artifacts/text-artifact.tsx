import { ChatMarkdown } from '@/components/chat/chat-markdown';

import type { ChatArtifact } from '@/lib/chat/types';

export function TextArtifact({ artifact }: { artifact: ChatArtifact }) {
  return <ChatMarkdown content={artifact.summary ?? ''} />;
}
