'use client';

import { Check, Pencil, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition, type KeyboardEvent } from 'react';

import { renameConversationAction } from '@/app/(app)/actions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';
import { cn } from '@/lib/utils';

import type { ConversationSummary } from '@/lib/chat/types';

const strings = chatStrings.history;

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
}

function activeIdFromPath(pathname: string): string | null {
  const prefix = '/chat/';
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : null;
}

export function ConversationSidebar({ conversations }: ConversationSidebarProps) {
  const isOpen = useChatStore((state) => state.isHistoryOpen);
  const setHistoryOpen = useChatStore((state) => state.setHistoryOpen);

  const pathname = usePathname();
  const router = useRouter();
  const activeId = activeIdFromPath(pathname);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();

  function close() {
    setHistoryOpen(false);
  }

  function startEditing(conversation: ConversationSummary) {
    setEditingId(conversation.id);
    setDraft(conversation.title ?? '');
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft('');
  }

  function saveEditing() {
    const id = editingId;
    const title = draft.trim();

    if (!id || !title) {
      return;
    }

    startTransition(async () => {
      const result = await renameConversationAction(id, title);
      if (result.ok) {
        cancelEditing();
        router.refresh();
      }
    });
  }

  function onEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEditing();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label={strings.close}
          className="fixed inset-x-0 top-14 bottom-0 z-30 bg-black/40 md:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        aria-label={strings.title}
        className={cn(
          'fixed top-14 bottom-0 left-0 z-40 flex w-72 flex-col border-r bg-background transition-transform md:static md:top-0 md:z-auto md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-3">
          <Button
            render={<Link href="/chat" onClick={close} />}
            variant="outline"
            className="w-full justify-start"
          >
            <Plus />
            {strings.newConversation}
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-1 px-3 pb-3">
            {conversations.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">{strings.empty}</p>
            ) : (
              conversations.map((conversation) => {
                const isActive = conversation.id === activeId;
                const isEditing = conversation.id === editingId;

                if (isEditing) {
                  return (
                    <div key={conversation.id} className="flex items-center gap-1 px-1 py-1">
                      <input
                        ref={(node) => {
                          if (node && document.activeElement !== node) {
                            node.focus();
                          }
                        }}
                        aria-label={strings.renameLabel}
                        value={draft}
                        disabled={isPending}
                        onChange={(event) => {
                          setDraft(event.target.value);
                        }}
                        onKeyDown={onEditKeyDown}
                        className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={strings.save}
                        disabled={isPending}
                        onClick={saveEditing}
                      >
                        <Check />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={strings.cancel}
                        disabled={isPending}
                        onClick={cancelEditing}
                      >
                        <X />
                      </Button>
                    </div>
                  );
                }

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      'group flex items-center gap-1 rounded-md transition-colors hover:bg-accent',
                      isActive && 'bg-accent'
                    )}
                  >
                    <Link
                      href={`/chat/${conversation.id}`}
                      onClick={close}
                      className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-2"
                    >
                      <span className="truncate text-sm font-medium">
                        {conversation.title ?? strings.untitled}
                      </span>
                      {conversation.lastMessage ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {conversation.lastMessage}
                        </span>
                      ) : null}
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`${strings.rename}: ${conversation.title ?? strings.untitled}`}
                      className="mr-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => {
                        startEditing(conversation);
                      }}
                    >
                      <Pencil />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
