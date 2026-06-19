import { ArtifactRenderer } from '@/components/chat/artifacts/artifact-renderer';

import type { ChatArtifact } from '@/lib/chat/types';

/** Renders the list of typed artifacts attached to an assistant answer. */
export function ArtifactList({ artifacts }: { artifacts: ChatArtifact[] }) {
  if (artifacts.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {artifacts.map((artifact) => (
        <ArtifactRenderer key={artifact.artifactId} artifact={artifact} />
      ))}
    </div>
  );
}
