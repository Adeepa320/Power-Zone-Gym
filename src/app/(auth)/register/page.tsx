import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { membershipCategorySchema } from '@/lib/validations';
import { RegisterForm } from '@/components/forms/RegisterForm';

export const metadata: Metadata = { title: 'Join Now' };

export default async function RegisterPage({ searchParams }: { searchParams: { plan?: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(session.user.role === 'admin' ? '/admin/members' : '/member');

  const plan = membershipCategorySchema.safeParse(searchParams.plan);
  return <RegisterForm defaultPlan={plan.success ? plan.data : undefined} />;
}
