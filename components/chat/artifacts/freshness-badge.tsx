import { Badge } from '@/components/ui/badge';
import { chatStrings } from '@/lib/chat/strings';

import type { ArtifactFreshness } from '@/lib/chat/types';

const strings = chatStrings.artifacts.freshness;

/** Per-artifact recency signal (ADR-0005: always surfaced). */
export function FreshnessBadge({ freshness }: { freshness: ArtifactFreshness }) {
  const status = freshness.status?.toLowerCase();
  const variant = status === 'fresh' ? 'secondary' : status === 'stale' ? 'destructive' : 'outline';
  const label =
    status === 'fresh'
      ? strings.fresh
      : status === 'stale'
        ? strings.stale
        : (freshness.status ?? strings.unknown);

  return (
    <Badge
      variant={variant}
      title={freshness.generatedAt ? `${strings.generatedAt}: ${freshness.generatedAt}` : undefined}
    >
      {label}
    </Badge>
  );
}
