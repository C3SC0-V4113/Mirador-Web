import { redirect } from 'next/navigation';

import { auth } from '@/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mirador',
};

export default async function Home() {
  const session = await auth();
  redirect(session?.user ? '/chat' : '/login');
}
