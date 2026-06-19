import { chatStrings } from '@/lib/chat/strings';

import type { ArtifactRow, ChatArtifact } from '@/lib/chat/types';

function firstNumericValue(row: ArtifactRow): string | undefined {
  for (const value of Object.values(row)) {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
  }
  return undefined;
}

/** Metric callout. The frame is the Card, so this renders plain content. */
export function KpiArtifact({ artifact }: { artifact: ChatArtifact }) {
  const row = artifact.data?.[0];
  const value = row ? firstNumericValue(row) : undefined;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-semibold tabular-nums">
        {value ?? artifact.summary ?? chatStrings.artifacts.kpiNoValue}
      </span>
      {value && artifact.summary ? (
        <span className="text-sm text-muted-foreground">{artifact.summary}</span>
      ) : null}
    </div>
  );
}
