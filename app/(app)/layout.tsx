import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ChatRuntimeProvider } from '@/components/chat/chat-runtime-provider';
import { Composer } from '@/components/chat/composer';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { AppBar } from '@/components/layout/app-bar';
import { getConversations } from '@/lib/server/conversations';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Conversation list is fetched on the server — no client hook, no round-trip.
  const conversations = await getConversations();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppBar email={session.user.email ?? ''} role={session.user.role} />
      <div className="flex min-h-0 flex-1">
        <ConversationSidebar conversations={conversations} />
        <ChatRuntimeProvider>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
            <Composer />
          </div>
        </ChatRuntimeProvider>
      </div>
    </div>
  );
}
