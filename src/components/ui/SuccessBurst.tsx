'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const COLORS = ['#00d4ff', '#00ff88', '#ffaa00', '#8b5cf6', '#ff6b35', '#ff4fa3'];

/** Confetti burst rendered with Framer Motion (no extra dependency). */
export function Confetti({ count = 36 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const distance = 90 + Math.random() * 120;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 30,
          rotate: Math.random() * 540 - 270,
          color: COLORS[i % COLORS.length],
          size: 5 + Math.random() * 6,
          round: Math.random() > 0.5,
        };
      }),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={cn('absolute', p.round ? 'rounded-full' : 'rounded-sm')}
          style={{ width: p.size, height: p.size * (p.round ? 1 : 1.8), background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 140], opacity: [1, 1, 0], scale: 1, rotate: p.rotate }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/** Animated check mark with expanding rings + confetti. */
export function SuccessBurst({ size = 96, confetti = true, tone = 'success' }: { size?: number; confetti?: boolean; tone?: 'success' | 'primary' }) {
  const color = tone === 'success' ? '#00ff88' : '#00d4ff';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 2, height: size * 2 }}>
      {confetti && <Confetti />}
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border-2"
          style={{ width: size, height: size, borderColor: color }}
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.2 + i * 0.25, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="relative flex items-center justify-center rounded-full"
        style={{ width: size, height: size, background: color, boxShadow: `0 0 48px ${color}88` }}
      >
        <motion.svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="#0a0a0a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}

export default SuccessBurst;
