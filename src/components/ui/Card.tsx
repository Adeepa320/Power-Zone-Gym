'use client';

import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Variants used by parents with `staggerChildren` to animate cards in sequence. */
export const cardItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export interface CardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const paddings = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' };

/** Glassmorphism card. Inherits stagger variants when placed inside `staggerContainer`. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { hover = false, glow = false, padding = 'md', className, children, ...props },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      variants={cardItem}
      whileHover={hover ? { y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } } : undefined}
      className={cn(
        'glass relative rounded-2xl',
        paddings[padding],
        hover && 'cursor-pointer transition-colors hover:border-white/20 hover:bg-white/[0.06]',
        glow && 'shadow-glow',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-[18px] [&>svg]:w-[18px]">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default Card;
