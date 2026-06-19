import { EmptyData } from '@/components/chat/artifacts/empty-data';
import { ChatMarkdown } from '@/components/chat/chat-markdown';
import { Badge } from '@/components/ui/badge';
import { chatStrings } from '@/lib/chat/strings';

import type { ActionPlanItem, ChatArtifact } from '@/lib/chat/types';

const kinds = chatStrings.artifacts.actionKinds;

function kindVariant(kind: ActionPlanItem['kind']): 'secondary' | 'destructive' | 'outline' {
  if (kind === 'risk') {
    return 'destructive';
  }
  if (kind === 'next_step') {
    return 'outline';
  }
  return 'secondary';
}

function kindLabel(kind: ActionPlanItem['kind']): string {
  return kinds[kind ?? 'action'];
}

/** Structured list of actions / risks / next steps (ADR-0005). */
export function ActionPlanArtifact({ artifact }: { artifact: ChatArtifact }) {
  const actions = artifact.actions ?? [];

  if (actions.length === 0) {
    return artifact.summary ? <ChatMarkdown content={artifact.summary} /> : <EmptyData />;
  }

  return (
    <div className="flex flex-col gap-3">
      {artifact.summary ? <ChatMarkdown content={artifact.summary} /> : null}
      <ul className="flex flex-col gap-2">
        {actions.map((action) => (
          <li key={action.title} className="flex items-start gap-2">
            <Badge variant={kindVariant(action.kind)} className="mt-0.5 shrink-0">
              {kindLabel(action.kind)}
            </Badge>
            <div>
              <p className="font-medium">{action.title}</p>
              {action.detail ? (
                <p className="text-sm text-muted-foreground">{action.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
