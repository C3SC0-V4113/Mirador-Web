'use client';

import { PanelLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';

/** Mobile-only trigger that opens the conversation sidebar (slide-over). */
export function SidebarToggle() {
  const setHistoryOpen = useChatStore((state) => state.setHistoryOpen);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="md:hidden"
      aria-label={chatStrings.history.open}
      onClick={() => {
        setHistoryOpen(true);
      }}
    >
      <PanelLeft />
    </Button>
  );
}
