import { Badge } from '@/components/ui/badge';

import type { Citation } from '@/lib/chat/types';

interface CitationListProps {
  citations: Citation[];
  title: string;
}

/** Renders document-grounded references as data (never as markup) — ADR-0005. */
export function CitationList({ citations, title }: CitationListProps) {
  return (
    <section aria-label={title}>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {citations.map((citation) => (
          <li key={`${citation.documentId}-${citation.locator}`}>
            <Badge variant="outline" className="h-auto items-start gap-1 px-2 py-1 text-left">
              <span className="font-medium">{citation.title}</span>
              <span className="text-muted-foreground">· {citation.locator}</span>
            </Badge>
            <p className="mt-0.5 pl-2 text-xs text-muted-foreground">{citation.snippet}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
