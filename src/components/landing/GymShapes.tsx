'use client';

import { motion } from 'framer-motion';

/* Abstract gym-equipment outlines drawn as SVG — no images required. */

export function DumbbellOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 48" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="6" y="12" width="10" height="24" rx="3" />
      <rect x="18" y="4" width="12" height="40" rx="3" />
      <rect x="30" y="21" width="60" height="6" rx="2" />
      <rect x="90" y="4" width="12" height="40" rx="3" />
      <rect x="104" y="12" width="10" height="24" rx="3" />
    </svg>
  );
}

export function KettlebellOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M20 26c-2-4-3-8-3-11C17 8 23 3 32 3s15 5 15 12c0 3-1 7-3 11" />
      <path d="M24 24c-1-3-1-5-1-8 0-4 4-7 9-7s9 3 9 7c0 3 0 5-1 8" />
      <path d="M14 46c0-12 8-21 18-21s18 9 18 21c0 9-5 16-10 20H24C19 62 14 55 14 46z" />
      <path d="M26 46h12" opacity="0.5" />
    </svg>
  );
}

export function PlateOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="40" cy="40" r="37" />
      <circle cx="40" cy="40" r="28" opacity="0.6" />
      <circle cx="40" cy="40" r="7" />
      <path d="M40 12v6M40 62v6M12 40h6M62 40h6" opacity="0.6" />
    </svg>
  );
}

export function HeartbeatLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" fill="none" className={className} aria-hidden>
      <motion.path
        d="M0 30h120l12-22 16 44 14-36 10 14h228"
        stroke="url(#hb)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <defs>
        <linearGradient id="hb" x1="0" x2="1">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Animated hero backdrop: gradient orbs, grid + dot patterns, floating equipment. */
export function HeroBackground() {
  const floaters = [
    { C: DumbbellOutline, className: 'left-[6%] top-[22%] w-28 text-primary/40', d: 7, r: [-8, 8] },
    { C: KettlebellOutline, className: 'right-[8%] top-[18%] w-16 text-violet/50', d: 8, r: [6, -6] },
    { C: PlateOutline, className: 'right-[14%] bottom-[16%] w-24 text-[#ff6b35]/40', d: 9, r: [0, 180] },
    { C: PlateOutline, className: 'left-[12%] bottom-[12%] w-14 text-success/30', d: 6, r: [0, -180] },
    { C: DumbbellOutline, className: 'right-[32%] top-[10%] w-16 text-white/10 hidden md:block', d: 10, r: [20, 30] },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* ADD GYM PHOTO HERE LATER — e.g. <Image src="/images/hero.jpg" fill className="object-cover opacity-20" alt="" /> */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-800 to-ink-700" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute inset-0 bg-dot-pattern bg-dots opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_40%,transparent)]" />

      {/* Gradient orbs */}
      <motion.div
        className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-40 top-20 h-[480px] w-[480px] rounded-full bg-violet/25 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-200px] left-1/3 h-[420px] w-[420px] rounded-full bg-[#ff6b35]/15 blur-[120px]"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rotating rings */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-glow" />
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.05]"
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-success" />
      </motion.div>

      {/* Diagonal light streaks */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute h-px w-[40%] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          style={{ top: `${25 + i * 22}%`, left: '-40%', rotate: '-12deg' }}
          animate={{ left: ['-40%', '120%'] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, delay: i * 2.5, ease: 'easeInOut' }}
        />
      ))}

      {floaters.map(({ C, className, d, r }, i) => (
        <motion.div
          key={i}
          className={`absolute ${className}`}
          animate={{ y: [0, -24, 0], rotate: r }}
          transition={{ duration: d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        >
          <C className="h-auto w-full" />
        </motion.div>
      ))}

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
