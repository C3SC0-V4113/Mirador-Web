import { ChatConversation } from '@/components/chat/chat-conversation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat · Mirador',
};

/** New conversation: no id in the route, empty thread. */
export default function ChatPage() {
  return <ChatConversation conversationId={null} initialMessages={[]} />;
}
