'use client';

import { History, Plus, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import {
  loadConversations,
  openConversation,
  startNewConversation,
} from '@/components/chat/use-conversation-history';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';
import { cn } from '@/lib/utils';

const strings = chatStrings.history;

export function ConversationHistory() {
  const isOpen = useChatStore((state) => state.isHistoryOpen);
  const setHistoryOpen = useChatStore((state) => state.setHistoryOpen);

  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const isLoading = useChatStore((state) => state.isLoadingConversations);

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Drive the native <dialog> from store state: showModal()/close() give focus
  // trapping, Escape-to-close and the backdrop for free.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      void loadConversations();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={strings.open}
        aria-expanded={isOpen}
        onClick={() => {
          setHistoryOpen(true);
        }}
      >
        <History />
      </Button>

      <dialog
        ref={dialogRef}
        aria-label={strings.title}
        onClose={() => {
          setHistoryOpen(false);
        }}
        className="m-0 h-dvh max-h-dvh w-80 max-w-[85vw] bg-background text-foreground shadow-lg backdrop:bg-black/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">{strings.title}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={strings.close}
              onClick={() => {
                setHistoryOpen(false);
              }}
            >
              <X />
            </Button>
          </div>

          <div className="p-3">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                startNewConversation();
                setHistoryOpen(false);
              }}
            >
              <Plus />
              {strings.newConversation}
            </Button>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-1 px-3 pb-3">
              {isLoading ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                  <Spinner />
                  {strings.loading}
                </div>
              ) : conversations.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">{strings.empty}</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      void openConversation(conversation.id);
                      setHistoryOpen(false);
                    }}
                    className={cn(
                      'flex flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent',
                      conversation.id === activeConversationId && 'bg-accent'
                    )}
                  >
                    <span className="truncate font-medium">
                      {conversation.title ?? strings.untitled}
                    </span>
                    {conversation.lastMessage ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {conversation.lastMessage}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </dialog>
    </>
  );
}
