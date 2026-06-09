import { Telescope } from 'lucide-react';

import { SuggestionPills } from '@/components/chat/suggestion-pills';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { chatStrings } from '@/lib/chat/strings';

const strings = chatStrings.emptyState;

export function ChatEmptyState() {
  return (
    <Empty className="border-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Telescope />
        </EmptyMedia>
        <EmptyTitle>{strings.title}</EmptyTitle>
        <EmptyDescription>{strings.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <p className="text-xs font-medium text-muted-foreground">{strings.suggestionsTitle}</p>
        <SuggestionPills questions={strings.suggestions} aria-label={strings.suggestionsTitle} />
      </EmptyContent>
    </Empty>
  );
}
