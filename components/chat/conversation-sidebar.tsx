'use client';

import { Check, Pencil, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition, type KeyboardEvent } from 'react';

import { renameConversationAction } from '@/app/(app)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { chatStrings } from '@/lib/chat/strings';

import type { ConversationSummary } from '@/lib/chat/types';

const strings = chatStrings.history;

function activeIdFromPath(pathname: string): string | null {
  const prefix = '/chat/';
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : null;
}

export function ConversationSidebar({ conversations }: { conversations: ConversationSummary[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const activeId = activeIdFromPath(pathname);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();

  function closeMobile() {
    setOpenMobile(false);
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
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/chat" onClick={closeMobile} />}>
              <Plus />
              <span>{strings.newConversation}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{strings.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            {conversations.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">{strings.empty}</p>
            ) : (
              <SidebarMenu>
                {conversations.map((conversation) => {
                  if (conversation.id === editingId) {
                    return (
                      <SidebarMenuItem key={conversation.id}>
                        <div className="flex items-center gap-1 px-1">
                          <Input
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
                            className="h-7 min-w-0 flex-1 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={strings.save}
                            disabled={isPending}
                            onClick={saveEditing}
                          >
                            <Check />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={strings.cancel}
                            disabled={isPending}
                            onClick={cancelEditing}
                          >
                            <X />
                          </Button>
                        </div>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton
                        isActive={conversation.id === activeId}
                        tooltip={conversation.title ?? strings.untitled}
                        render={<Link href={`/chat/${conversation.id}`} onClick={closeMobile} />}
                      >
                        <span className="truncate">{conversation.title ?? strings.untitled}</span>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        showOnHover
                        aria-label={`${strings.rename}: ${conversation.title ?? strings.untitled}`}
                        onClick={() => {
                          startEditing(conversation);
                        }}
                      >
                        <Pencil />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
