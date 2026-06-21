import { notFound } from 'next/navigation';

import { ChatConversation } from '@/components/chat/chat-conversation';
import { getConversationDetail } from '@/lib/server/conversations';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat · Mirador',
};

/** A specific conversation, loaded and rehydrated on the server. */
export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const detail = await getConversationDetail(conversationId);

  if (!detail) {
    notFound();
  }

  return (
    <ChatConversation conversationId={detail.conversationId} initialMessages={detail.messages} />
  );
}
