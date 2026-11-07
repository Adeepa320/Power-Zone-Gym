'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import type { WorkoutPlanDTO } from '@/types';
import { dayColor } from './PlanViewer';

/** Compact dashboard card body: pick a day, see its exercises. */
export function PlanPreview({ plan, maxExercises = 6 }: { plan: WorkoutPlanDTO; maxExercises?: number }) {
  const [active, setActive] = useState(0);
  const day = plan.days[active];
  const color = dayColor(active);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{plan.planTitle}</h3>
        <span className="text-xs text-muted">Updated {formatDate(plan.updatedAt)}</span>
      </div>

      <div className="scrollbar-thin -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {plan.days.map((d, i) => (
          <button
            key={d._id ?? i}
            onClick={() => setActive(i)}
            className={cn('shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition', i === active ? 'border-transparent text-ink-950' : 'border-white/10 text-muted hover:text-white')}
            style={i === active ? { background: dayColor(i) } : undefined}
          >
            Day {d.dayNumber}
            {d.dayTitle && <span className="ml-1 font-normal opacity-80">· {d.dayTitle}</span>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {day && (
          <motion.ul key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mt-3 space-y-2">
            {day.exercises.slice(0, maxExercises).map((e, i) => (
              <li key={e._id ?? i} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-xs" style={{ color }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{e.name}</span>
                </span>
                {e.setsReps && <span className="shrink-0 font-mono text-xs text-muted">{e.setsReps}</span>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      {day && day.exercises.length > maxExercises && <p className="mt-2 text-xs text-muted">+{day.exercises.length - maxExercises} more exercises</p>}

      <Link href="/member/my-chart" className="mt-5 inline-block">
        <Button variant="outline" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
          Open full plan
        </Button>
      </Link>
    </div>
  );
}

export default PlanPreview;
