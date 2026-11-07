'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSession, signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Info, Lock, LogIn, Mail } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { GYM } from '@/lib/constants';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [forgotOpen, setForgotOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    const res = await signIn('credentials', { ...values, redirect: false });
    if (!res || res.error) {
      toast.error(res?.error && res.error !== 'CredentialsSignin' ? res.error : 'Invalid email or password');
      return;
    }
    const session = await getSession();
    const role = session?.user?.role;
    toast.success(`Welcome back, ${session?.user?.name?.split(' ')[0] ?? 'champ'}!`);

    // Respect callbackUrl only when it matches the user's area.
    const callbackUrl = params.get('callbackUrl');
    let target = role === 'admin' ? '/admin' : '/member';
    if (callbackUrl) {
      try {
        const path = new URL(callbackUrl, window.location.origin).pathname;
        if (path.startsWith(target)) target = path;
      } catch {
        /* ignore malformed callbackUrl */
      }
    }
    router.replace(target);
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      className="glass-strong relative w-full max-w-md overflow-hidden rounded-3xl p-8 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-violet/20 blur-3xl" />

      <div className="relative">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 16 }}
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet text-ink-950 shadow-glow"
        >
          <LogIn className="h-6 w-6" />
        </motion.div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted">Sign in to your {GYM.name} account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            icon={<Mail />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<Lock />}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <Button type="submit" fullWidth size="lg" loading={isSubmitting} glow>
            Sign in
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          New to {GYM.shortName}?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Forgot your password?" size="sm">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-2 text-sm text-muted">
            <p>For your security, passwords are reset by the gym staff.</p>
            <p>
              Please visit the front desk or call <span className="font-medium text-white">{GYM.phone}</span> and an
              admin will set a new password for you.
            </p>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

export default LoginForm;
