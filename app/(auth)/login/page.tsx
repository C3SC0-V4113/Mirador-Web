import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { LoginForm } from '@/components/auth/login-form';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar sesión · Mirador',
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/chat');
  }

  return <LoginForm />;
}
