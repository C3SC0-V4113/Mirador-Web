import { TriangleAlert } from 'lucide-react';

import { FreshnessBadge } from '@/components/chat/artifacts/freshness-badge';
import { CopyTraceButton } from '@/components/chat/copy-trace-button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { chatStrings } from '@/lib/chat/strings';

import type { ChatArtifact } from '@/lib/chat/types';
import type { ReactNode } from 'react';

const strings = chatStrings.artifacts;

/**
 * Shared shell for every artifact: header (question/period + freshness), the
 * typed body, and a footer with warnings + a copyable trace id. The frame is the
 * single Card so renderers never nest cards (DESIGN.md).
 */
export function ArtifactFrame({
  artifact,
  children,
}: {
  artifact: ChatArtifact;
  children: ReactNode;
}) {
  const warnings = artifact.warnings ?? [];
  const hasHeader = Boolean(artifact.question || artifact.period || artifact.freshness);
  const hasFooter = warnings.length > 0 || Boolean(artifact.traceId);

  return (
    <Card size="sm" className="bg-background">
      {hasHeader ? (
        <CardHeader>
          {artifact.question ? <CardTitle>{artifact.question}</CardTitle> : null}
          {artifact.period ? (
            <CardDescription>
              {strings.period}: {artifact.period}
            </CardDescription>
          ) : null}
          {artifact.freshness ? (
            <CardAction>
              <FreshnessBadge freshness={artifact.freshness} />
            </CardAction>
          ) : null}
        </CardHeader>
      ) : null}

      <CardContent>{children}</CardContent>

      {hasFooter ? (
        <CardFooter className="flex-col items-start gap-2 text-xs">
          {warnings.length > 0 ? (
            <ul className="flex flex-col gap-1 text-destructive" aria-label={strings.warningsTitle}>
              {warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-1.5">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {artifact.traceId ? (
            <CopyTraceButton traceId={artifact.traceId} label={strings.traceLabel} />
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
