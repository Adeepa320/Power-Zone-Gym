'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { eachDayOfInterval, endOfMonth, format, getDay, isFuture, isToday, startOfMonth } from 'date-fns';
import { cn, formatTime } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Month calendar.
 *  - `attended`: per-member mode — attended days glow green (with check-in time tooltip)
 *  - `counts`:   heatmap mode — cell intensity scales with the day's check-in count
 */
export function AttendanceCalendar({
  month,
  year,
  attended,
  counts,
}: {
  month: number;
  year: number;
  attended?: { date: string; checkInTime?: string }[];
  counts?: { date: string; count: number }[];
}) {
  const { days, offset, attendedMap, countMap, max } = useMemo(() => {
    const start = startOfMonth(new Date(year, month - 1, 1));
    const days = eachDayOfInterval({ start, end: endOfMonth(start) });
    const offset = (getDay(start) + 6) % 7; // Monday-first
    const attendedMap = new Map((attended ?? []).map((a) => [format(new Date(a.date), 'yyyy-MM-dd'), a.checkInTime]));
    const countMap = new Map((counts ?? []).map((c) => [c.date, c.count]));
    const max = Math.max(1, ...(counts ?? []).map((c) => c.count));
    return { days, offset, attendedMap, countMap, max };
  }, [month, year, attended, counts]);

  const heatmap = Boolean(counts);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd');
          const present = attendedMap.has(key);
          const count = countMap.get(key) ?? 0;
          const future = isFuture(day) && !isToday(day);
          const intensity = heatmap ? count / max : 0;
          const title = heatmap
            ? `${format(day, 'dd MMM')}: ${count} check-in${count === 1 ? '' : 's'}`
            : present
              ? `Checked in at ${formatTime(attendedMap.get(key))}`
              : format(day, 'dd MMM');

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.012, type: 'spring', stiffness: 300, damping: 20 }}
              title={title}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-medium transition-colors sm:rounded-xl sm:text-sm',
                future && 'opacity-30',
                !heatmap && present && 'border-success/50 bg-success/20 text-success shadow-[0_0_16px_rgba(0,255,136,0.25)]',
                !heatmap && !present && 'border-white/5 bg-white/[0.03] text-muted',
                heatmap && count === 0 && 'border-white/5 bg-white/[0.03] text-muted',
                heatmap && count > 0 && 'border-primary/30 text-white',
                isToday(day) && 'ring-2 ring-primary/70 ring-offset-1 ring-offset-ink-950',
              )}
              style={heatmap && count > 0 ? { background: `rgba(0, 212, 255, ${0.12 + intensity * 0.6})` } : undefined}
            >
              {format(day, 'd')}
              {heatmap && count > 0 && <span className="text-[9px] font-semibold leading-none sm:text-[10px]">{count}</span>}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-end gap-3 text-[11px] text-muted">
        {heatmap ? (
          <>
            <span>Less</span>
            {[0.12, 0.3, 0.5, 0.72].map((o) => (
              <span key={o} className="h-3 w-3 rounded" style={{ background: `rgba(0,212,255,${o})` }} />
            ))}
            <span>More</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-success/40" /> Attended
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded ring-2 ring-primary/70" /> Today
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default AttendanceCalendar;
