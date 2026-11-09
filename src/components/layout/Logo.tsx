import Link from 'next/link';
import { GYM } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * SVG brand mark — a stylised dumbbell inside a hexagon.
 * `gradientId` must be unique per instance on a page: if another (hidden) logo defines the
 * same id, browsers may resolve the gradient to the hidden one and render nothing (e.g. in print).
 */
export function LogoMark({ className, gradientId = 'pz-logo' }: { className?: string; gradientId?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('h-9 w-9', className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="60%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ff6b35" />
        </linearGradient>
      </defs>
      <path d="M20 2l15.6 9v18L20 38 4.4 29V11z" fill={`url(#${gradientId})`} opacity="0.18" />
      <path d="M20 2l15.6 9v18L20 38 4.4 29V11z" fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.6" />
      <g fill={`url(#${gradientId})`}>
        <rect x="9" y="15" width="3.5" height="10" rx="1.2" />
        <rect x="13" y="13" width="3.5" height="14" rx="1.2" />
        <rect x="16.5" y="18.8" width="7" height="2.4" rx="1" />
        <rect x="23.5" y="13" width="3.5" height="14" rx="1.2" />
        <rect x="27.5" y="15" width="3.5" height="10" rx="1.2" />
      </g>
    </svg>
  );
}

export function Logo({ compact = false, href = '/', className }: { compact?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('group flex items-center gap-2.5', className)}>
      <span className="transition-transform duration-300 group-hover:rotate-[30deg]">
        <LogoMark />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold leading-none tracking-tight">
          {GYM.shortName.split(' ')[0]}
          <span className="text-gradient"> {GYM.shortName.split(' ').slice(1).join(' ')}</span>
        </span>
      )}
    </Link>
  );
}

export default Logo;
