import { ArtifactBody } from '@/components/chat/artifacts/artifact-body';
import { ArtifactFrame } from '@/components/chat/artifacts/artifact-frame';

import type { ChatArtifact } from '@/lib/chat/types';

/** Dispatches an artifact to its typed renderer, wrapped in the shared frame. */
export function ArtifactRenderer({ artifact }: { artifact: ChatArtifact }) {
  return (
    <ArtifactFrame artifact={artifact}>
      <ArtifactBody artifact={artifact} />
    </ArtifactFrame>
  );
}
