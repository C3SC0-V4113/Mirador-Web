import { ChatScreen } from '@/components/chat/chat-screen';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat · Mirador',
};

export default function ChatPage() {
  return <ChatScreen />;
}
