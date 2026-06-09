import * as ChatBubble from '@/components/chat/chat-bubble';

interface UserBubbleProps {
  text: string;
}

export function UserBubble({ text }: UserBubbleProps) {
  return (
    <ChatBubble.Root author="user" state="complete">
      <ChatBubble.Body>{text}</ChatBubble.Body>
    </ChatBubble.Root>
  );
}
