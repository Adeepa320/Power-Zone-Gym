'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { CalendarCheck, CreditCard, UserPlus } from 'lucide-react';
import type { ActivityItem } from '@/types';
import { cn } from '@/lib/utils';

const icons = {
  registration: { icon: UserPlus, className: 'bg-primary/10 text-primary' },
  payment: { icon: CreditCard, className: 'bg-success/10 text-success' },
  attendance: { icon: CalendarCheck, className: 'bg-violet/10 text-[#a78bfa]' },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No activity yet — it will show up here.</p>;
  }
  return (
    <ol className="relative space-y-1">
      <span className="absolute bottom-3 left-[19px] top-3 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
      {items.map((item, i) => {
        const { icon: Icon, className } = icons[item.type];
        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex items-start gap-3 rounded-xl p-2 transition hover:bg-white/[0.03]"
          >
            <span className={cn('relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl', className)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate text-xs text-muted">{item.description}</p>
            </div>
            <time className="shrink-0 pt-0.5 text-[11px] text-muted/70">
              {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
            </time>
          </motion.li>
        );
      })}
    </ol>
  );
}

export default ActivityFeed;
