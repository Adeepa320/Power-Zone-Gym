import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { HeroBackground } from '@/components/landing/GymShapes';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <HeroBackground />
      <div className="relative text-center">
        <Dumbbell className="mx-auto h-14 w-14 rotate-[-20deg] text-primary" />
        <h1 className="mt-6 font-display text-7xl font-extrabold text-gradient">404</h1>
        <p className="mt-3 text-lg font-semibold">This page skipped leg day.</p>
        <p className="mt-2 text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-primary to-[#3b82f6] px-6 text-sm font-semibold text-ink-950 transition hover:shadow-glow"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
