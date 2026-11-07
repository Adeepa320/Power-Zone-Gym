'use client';

import { forwardRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-[#3b82f6] text-ink-950 font-semibold hover:shadow-glow disabled:hover:shadow-none',
  secondary: 'bg-white/[0.07] text-white border border-white/10 hover:bg-white/[0.12] hover:border-white/20',
  ghost: 'bg-transparent text-muted hover:text-white hover:bg-white/[0.06]',
  danger: 'bg-danger/90 text-white hover:bg-danger hover:shadow-[0_0_24px_rgba(255,68,68,0.35)]',
  success: 'bg-gradient-to-r from-success to-[#00d4a8] text-ink-950 font-semibold hover:shadow-glow-success',
  outline: 'bg-transparent border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

type Ripple = { id: number; x: number; y: number; size: number };

/** Animated button with scale-on-hover, click ripple and loading state. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    fullWidth,
    glow,
    className,
    children,
    disabled,
    onClick,
    type = 'button',
    ...props
  },
  ref,
) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = { id: Date.now(), x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size };
    setRipples((r) => [...r, ripple]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x.id !== ripple.id)), 600);
    onClick?.(e);
  }

  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={isDisabled ? undefined : { scale: 1.03 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        'focus-ring relative inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap font-medium transition-[background,box-shadow,border-color,color] duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        glow && 'shadow-glow',
        className,
      )}
      {...props}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.35 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="pointer-events-none absolute rounded-full bg-white"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}
      </AnimatePresence>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children && <span className="relative">{children}</span>}
      {!loading && iconRight}
    </motion.button>
  );
});

export default Button;
