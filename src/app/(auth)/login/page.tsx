import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LoginForm } from '@/components/forms/LoginForm';
import { Loader } from '@/components/ui/Loader';

export const metadata: Metadata = { title: 'Member Login' };

export default async function LoginPage() {
  // Already signed in → go straight to the dashboard.
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(session.user.role === 'admin' ? '/admin' : '/member');

  return (
    <Suspense fallback={<Loader />}>
      <LoginForm />
    </Suspense>
  );
}
