'use client';

import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shimmering skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-white/[0.06]', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass rounded-2xl p-5', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex gap-4 border-b border-white/10 p-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-white/5 p-4 last:border-0">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass space-y-4 rounded-2xl p-5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-primary', className)}
      aria-label="Loading"
    />
  );
}

/** Full-area loader with a spinning dumbbell. */
export function Loader({ label = 'Loading…', fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-20', fullScreen && 'min-h-screen')}>
      <div className="relative h-16 w-16">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-primary"
          animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <Dumbbell className="h-6 w-6" />
        </motion.span>
      </div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export default Loader;
