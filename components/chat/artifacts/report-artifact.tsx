import { ChartArtifact } from '@/components/chat/artifacts/chart-artifact';
import { TableArtifact } from '@/components/chat/artifacts/table-artifact';
import { ChatMarkdown } from '@/components/chat/chat-markdown';

import type { ChatArtifact } from '@/lib/chat/types';

/** Composite report: narrative + chart and/or table from the same artifact. */
export function ReportArtifact({ artifact }: { artifact: ChatArtifact }) {
  const hasData = (artifact.data?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3">
      {artifact.summary ? <ChatMarkdown content={artifact.summary} /> : null}
      {artifact.chartSpec ? <ChartArtifact artifact={artifact} /> : null}
      {hasData ? <TableArtifact artifact={artifact} /> : null}
    </div>
  );
}
