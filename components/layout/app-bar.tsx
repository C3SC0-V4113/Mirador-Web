import { Brand } from '@/components/brand/brand';
import { ConversationHistory } from '@/components/chat/conversation-history';
import { UserMenu } from '@/components/layout/user-menu';

interface AppBarProps {
  email: string;
  role?: string;
}

export function AppBar({ email, role }: AppBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-1">
        <ConversationHistory />
        <Brand.Root>
          <Brand.Icon />
          <Brand.Wordmark className="hidden sm:inline" />
        </Brand.Root>
      </div>
      <UserMenu email={email} role={role} />
    </header>
  );
}
