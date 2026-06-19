import { chatStrings } from '@/lib/chat/strings';

/** Shared explicit empty-state for artifacts with no rows/spec (DESIGN.md). */
export function EmptyData() {
  return <p className="text-sm text-muted-foreground">{chatStrings.artifacts.emptyData}</p>;
}
