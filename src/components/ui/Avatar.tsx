import Image from 'next/image';
import { avatarGradient, cn, initials } from '@/lib/utils';

const sizes = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

/**
 * Avatar — shows the profile image when present, otherwise coloured initials.
 * (No stock photos are used anywhere in the app.)
 */
export function Avatar({
  name,
  src,
  size = 'sm',
  ring = false,
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  ring?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-ink-950',
        sizes[size],
        ring && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-ink-950',
        className,
      )}
      style={src ? undefined : { background: avatarGradient(name) }}
      aria-label={name}
      title={name}
    >
      {src ? (
        <Image src={src} alt={name} fill unoptimized className="object-cover" sizes="96px" />
      ) : (
        initials(name) || '?'
      )}
    </span>
  );
}

export default Avatar;
