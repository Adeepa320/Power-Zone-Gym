import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet';

const tones: Record<BadgeTone, { box: string; dot: string }> = {
  primary: { box: 'bg-primary/10 text-primary border-primary/25', dot: 'bg-primary' },
  success: { box: 'bg-success/10 text-success border-success/25', dot: 'bg-success' },
  warning: { box: 'bg-warning/10 text-warning border-warning/25', dot: 'bg-warning' },
  danger: { box: 'bg-danger/10 text-danger border-danger/25', dot: 'bg-danger' },
  violet: { box: 'bg-violet/10 text-[#a78bfa] border-violet/25', dot: 'bg-violet' },
  neutral: { box: 'bg-white/5 text-muted border-white/10', dot: 'bg-muted' },
};

export function Badge({
  tone = 'neutral',
  dot = false,
  pulse = false,
  icon,
  className,
  children,
  style,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  const t = tones[tone];
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium [&>svg]:h-3 [&>svg]:w-3',
        t.box,
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', t.dot)} />}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', t.dot)} />
        </span>
      )}
      {icon}
      {children}
    </span>
  );
}

export default Badge;
