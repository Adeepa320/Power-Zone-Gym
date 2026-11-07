'use client';

import type { ComponentType, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { cn } from '@/lib/utils';

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'violet';

const accents: Record<Accent, { text: string; bg: string; glow: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary/10', glow: '#00d4ff' },
  success: { text: 'text-success', bg: 'bg-success/10', glow: '#00ff88' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', glow: '#ffaa00' },
  danger: { text: 'text-danger', bg: 'bg-danger/10', glow: '#ff4444' },
  violet: { text: 'text-[#a78bfa]', bg: 'bg-violet/10', glow: '#8b5cf6' },
};

/** Animated statistic card with count-up value. Pass `display` to show non-numeric values. */
export function StatsCard({
  label,
  value,
  display,
  format,
  icon: Icon,
  accent = 'primary',
  hint,
  onClick,
}: {
  label: string;
  value?: number;
  display?: ReactNode;
  format?: (n: number) => string;
  icon: ComponentType<{ className?: string }>;
  accent?: Accent;
  hint?: ReactNode;
  onClick?: () => void;
}) {
  const a = accents[accent];
  return (
    <Card hover={Boolean(onClick)} onClick={onClick} className="group overflow-hidden">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: a.glow }}
      />
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <motion.span
          whileHover={{ rotate: 12, scale: 1.1 }}
          className={cn('flex h-10 w-10 items-center justify-center rounded-xl', a.bg, a.text)}
        >
          <Icon className="h-5 w-5" />
        </motion.span>
      </div>
      <div className="relative mt-3 font-display text-3xl font-bold tracking-tight">
        {display ?? <AnimatedCounter value={value ?? 0} format={format} />}
      </div>
      {hint && <div className="relative mt-2 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

export default StatsCard;
