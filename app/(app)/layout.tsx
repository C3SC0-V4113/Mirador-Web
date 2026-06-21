import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ChatRuntimeProvider } from '@/components/chat/chat-runtime-provider';
import { Composer } from '@/components/chat/composer';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { AppBar } from '@/components/layout/app-bar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getConversations } from '@/lib/server/conversations';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Conversation list is fetched on the server — no client hook, no round-trip.
  // The sidebar open state persists across reloads via the `sidebar_state` cookie.
  const [conversations, cookieStore] = await Promise.all([getConversations(), cookies()]);
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-dvh overflow-hidden">
      <ConversationSidebar conversations={conversations} />
      <SidebarInset className="flex h-dvh min-w-0 flex-col overflow-hidden">
        <AppBar email={session.user.email ?? ''} role={session.user.role} />
        <ChatRuntimeProvider>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          <Composer />
        </ChatRuntimeProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
