'use client';

import type { ComponentType, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Animated empty-state illustration built from an icon and concentric rings. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center', className)}
    >
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border border-primary/20"
            animate={{ scale: [1, 1.5 + i * 0.2], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 2.6, delay: i * 0.7, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-violet/20 text-primary"
        >
          <Icon className="h-7 w-7" />
        </motion.div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export default EmptyState;
