import { ChatEmptyState } from '@/components/chat/chat-empty-state';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat · Mirador',
};

export default function ChatPage() {
  return <ChatEmptyState />;
}
