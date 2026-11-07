'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Dumbbell, LayoutList, MessageSquareText, NotebookPen, Rows3, UserRound } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { groupExercises, realExercises } from '@/lib/workoutPlan';
import type { PlanDay, PlanExercise } from '@/types';

/** Colour per day so members can recognise "their" day at a glance. */
export const DAY_COLORS = ['#00d4ff', '#00ff88', '#ffaa00', '#8b5cf6', '#ff6b35', '#ff4fa3', '#38bdf8'];
export const dayColor = (index: number) => DAY_COLORS[index % DAY_COLORS.length];

export interface PlanViewData {
  gymName: string;
  planTitle: string;
  startDate?: string | Date;
  notes?: string;
  days: PlanDay[];
  updatedAt?: string;
  trainerName?: string;
  memberName?: string;
}

/**
 * Organised day-by-day display of a member's personal workout plan.
 * Includes a plain, ink-friendly layout that is used when printing.
 */
export function PlanViewer({ plan, compact = false }: { plan: PlanViewData; compact?: boolean }) {
  const [active, setActive] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const days = plan.days ?? [];
  const day = days[Math.min(active, Math.max(days.length - 1, 0))];
  const totalExercises = days.reduce((n, d) => n + realExercises(d.exercises).length, 0);

  return (
    <>
      {/* ---------- Screen view ---------- */}
      <div className="space-y-5 print:hidden">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-7">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet/15 to-transparent" />
          <div className="absolute inset-0 bg-grid-pattern bg-[length:28px_28px] opacity-40" />
          <Dumbbell className="absolute -right-6 -top-6 h-36 w-36 rotate-12 text-white/[0.06]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{plan.gymName || 'Gym'}</p>
            <h2 className={cn('mt-2 font-bold', compact ? 'text-xl' : 'text-2xl sm:text-3xl')}>{plan.planTitle || 'Untitled plan'}</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {plan.memberName && (
                <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <UserRound className="h-3.5 w-3.5 text-primary" /> {plan.memberName}
                </span>
              )}
              <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
                <Rows3 className="h-3.5 w-3.5 text-success" /> {days.length} day{days.length === 1 ? '' : 's'} · {totalExercises} exercises
              </span>
              {plan.startDate && (
                <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-warning" /> From {formatDate(plan.startDate)}
                </span>
              )}
              {plan.trainerName && <span className="glass rounded-full px-3 py-1.5 text-muted">Updated by {plan.trainerName}</span>}
              {plan.updatedAt && <span className="glass rounded-full px-3 py-1.5 text-muted">Updated {formatDate(plan.updatedAt)}</span>}
            </div>
          </div>
        </div>

        {plan.notes && (
          <div className="flex gap-3 rounded-2xl border border-warning/25 bg-warning/[0.06] p-4 text-sm">
            <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-warning">Trainer notes</p>
              <p className="mt-1 whitespace-pre-line text-white/90">{plan.notes}</p>
            </div>
          </div>
        )}

        {days.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-muted">No days added yet.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="scrollbar-thin -mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1">
                {days.map((d, i) => {
                  const selected = !showAll && i === active;
                  return (
                    <button
                      key={d._id ?? i}
                      onClick={() => {
                        setShowAll(false);
                        setActive(i);
                      }}
                      className={cn(
                        'relative shrink-0 rounded-xl border px-4 py-2 text-left transition',
                        selected ? 'border-transparent text-ink-950' : 'border-white/10 text-muted hover:border-white/25 hover:text-white',
                      )}
                    >
                      {selected && (
                        <motion.span layoutId={compact ? 'day-pill-c' : 'day-pill'} className="absolute inset-0 rounded-xl" style={{ background: dayColor(i) }} />
                      )}
                      <span className="relative block text-[10px] font-bold uppercase tracking-wider">Day {d.dayNumber}</span>
                      <span className="relative block max-w-[160px] truncate text-sm font-semibold">{d.dayTitle || `${realExercises(d.exercises).length} exercises`}</span>
                    </button>
                  );
                })}
              </div>
              {days.length > 1 && (
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className={cn('shrink-0 rounded-xl border p-2.5 transition', showAll ? 'border-primary/50 bg-primary/15 text-primary' : 'border-white/10 text-muted hover:text-white')}
                  title={showAll ? 'Show one day' : 'Show all days'}
                  aria-label="Toggle all days"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={showAll ? 'all' : active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {(showAll ? days : day ? [day] : []).map((d) => (
                  <DayBlock key={d._id ?? d.dayNumber} day={d} index={days.indexOf(d)} showHeading={showAll} />
                ))}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ---------- Print view (plain, ink-friendly) ---------- */}
      <div className="hidden text-black print:block">
        <h1 className="text-2xl font-bold">{plan.gymName}</h1>
        <h2 className="text-lg font-semibold">{plan.planTitle}</h2>
        <p className="mt-1 text-sm">
          {plan.memberName && <>Member: {plan.memberName} · </>}
          {plan.startDate && <>From {formatDate(plan.startDate)} · </>}
          {days.length} days
        </p>
        {plan.notes && <p className="mt-3 whitespace-pre-line border-l-4 border-black pl-3 text-sm">{plan.notes}</p>}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {days.map((d) => (
            <div key={d._id ?? d.dayNumber} className="break-inside-avoid border border-black p-3">
              <p className="font-bold">
                Day {d.dayNumber}
                {d.dayTitle && ` – ${d.dayTitle}`}
              </p>
              {groupExercises(d.exercises).map((group, gi) => (
                <div key={gi} className={gi > 0 ? 'mt-4' : 'mt-2'}>
                  {group.title ? (
                    <p className="border-b-2 border-black pb-0.5 text-xs font-bold uppercase tracking-wider">{group.title}</p>
                  ) : (
                    gi > 0 && <div className="border-t-2 border-dashed border-gray-400" />
                  )}
                  <table className="w-full text-sm">
                    <tbody>
                      {group.items.map(({ exercise: ex }, i) => (
                        <tr key={ex._id ?? i} className={i > 0 || group.title ? 'border-t border-gray-300' : ''}>
                          <td className="py-1 pr-2">
                            {ex.name}
                            {ex.notes && <span className="block text-xs italic">{ex.notes}</span>}
                          </td>
                          <td className="whitespace-nowrap py-1 text-right font-semibold">{ex.setsReps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DayBlock({ day, index, showHeading }: { day: PlanDay; index: number; showHeading: boolean }) {
  const color = dayColor(index);
  return (
    <div>
      {showHeading && (
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-lg px-2.5 py-1 text-xs font-bold text-ink-950" style={{ background: color }}>
            DAY {day.dayNumber}
          </span>
          <h3 className="font-semibold">{day.dayTitle}</h3>
        </div>
      )}
      {!showHeading && day.dayTitle && <h3 className="mb-3 text-lg font-semibold">{day.dayTitle}</h3>}
      <div className="space-y-6">
        {groupExercises(day.exercises).map((group, gi) => (
          <div key={gi}>
            {(group.title || gi > 0) && (
              <div className="mb-2.5 flex items-center gap-3">
                {group.title && (
                  <span className="shrink-0 text-xs font-bold uppercase tracking-[0.15em]" style={{ color }}>
                    {group.title}
                  </span>
                )}
                <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}66, transparent)` }} />
              </div>
            )}
            <ol className="space-y-2">
              {group.items.map(({ exercise: ex, number }) => (
                <ExerciseRow key={ex._id ?? `${ex.name}-${number}`} ex={ex} number={number} color={color} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExerciseRow({ ex, number, color }: { ex: PlanExercise; number: number; color: string }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(number * 0.04, 0.4) }}
      className="glass flex items-center gap-4 rounded-xl px-4 py-3"
    >
      <span className="w-6 shrink-0 text-center font-mono text-xs font-bold" style={{ color }}>
        {String(number).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{ex.name}</p>
        {ex.notes && (
          <p className="mt-0.5 flex items-start gap-1.5 text-xs text-muted">
            <MessageSquareText className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
            {ex.notes}
          </p>
        )}
      </div>
      {ex.setsReps && (
        <span className="shrink-0 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold" style={{ borderColor: `${color}55`, background: `${color}14`, color }}>
          {ex.setsReps}
        </span>
      )}
    </motion.li>
  );
}

export default PlanViewer;
