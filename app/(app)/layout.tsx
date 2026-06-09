import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Composer } from '@/components/chat/composer';
import { AppBar } from '@/components/layout/app-bar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppBar email={session.user.email ?? ''} role={session.user.role} />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      <Composer />
    </div>
  );
}
