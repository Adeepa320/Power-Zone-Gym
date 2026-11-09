import { Dumbbell, Flame } from 'lucide-react';
import { LogoMark } from '@/components/layout/Logo';
import { GYM } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { groupExercises, realExercises } from '@/lib/workoutPlan';
import type { PlanDay } from '@/types';

/** Accent colours tuned for paper: darker than the on-screen neon so they stay legible in print. */
const PRINT_ACCENTS = ['#0891b2', '#059669', '#d97706', '#7c3aed', '#ea580c', '#db2777', '#0284c7'];
const accent = (i: number) => PRINT_ACCENTS[i % PRINT_ACCENTS.length];

export interface PrintablePlan {
  gymName: string;
  planTitle: string;
  startDate?: string | Date;
  notes?: string;
  days: PlanDay[];
  memberName?: string;
  memberGoal?: string;
  trainerName?: string;
}

/**
 * Print-only workout sheet (shown via `hidden print:block`).
 * Ink-friendly: white page, crisp type and hairlines, small accent touches only.
 * Pen check-boxes let members tick off each exercise on the gym floor.
 */
export function PrintableWorkoutSheet({ plan }: { plan: PrintablePlan }) {
  const days = plan.days ?? [];
  const totalExercises = days.reduce((n, d) => n + realExercises(d.exercises).length, 0);
  const gymName = (plan.gymName || GYM.name).toUpperCase();

  const info = [
    { label: 'Member', value: plan.memberName || '—' },
    { label: plan.memberGoal ? 'Goal' : 'Program', value: plan.memberGoal || plan.planTitle },
    { label: 'Date Issued', value: plan.startDate ? formatDate(plan.startDate) : '—' },
    { label: 'Frequency', value: `${days.length} Day${days.length === 1 ? '' : 's'} / Week` },
  ];

  return (
    <div className="print-sheet bg-white font-sans text-zinc-900">
      {/* Brand strip */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #00d4ff, #8b5cf6 55%, #ff6b35)' }} />

      <div className="px-[13mm] pb-[10mm] pt-[8mm]">
        {/* ---------- Header ---------- */}
        <header className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-12 w-12" gradientId="pz-logo-print" />
            <div>
              <h1 className="font-display text-[26px] font-extrabold uppercase leading-none tracking-tight">{gymName}</h1>
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-zinc-900 px-2.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[0.22em]">
                <Dumbbell className="h-3 w-3" strokeWidth={2.5} />
                Official Training Program
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Workout Plan</p>
            <p className="mt-0.5 max-w-[80mm] font-display text-[16px] font-bold leading-tight">{plan.planTitle}</p>
            <p className="mt-0.5 text-[9px] text-zinc-500">
              {days.length} days · {totalExercises} exercises
              {plan.trainerName ? ` · Coach ${plan.trainerName}` : ''}
            </p>
          </div>
        </header>

        {/* ---------- Member / program info strip ---------- */}
        <div className="mt-5 grid grid-cols-4 overflow-hidden rounded-xl border border-zinc-300">
          {info.map((item, i) => (
            <div key={item.label} className={`px-3.5 py-2.5 ${i > 0 ? 'border-l border-zinc-300' : ''} ${i === 0 ? 'bg-zinc-50' : ''}`}>
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
              <p className="mt-0.5 truncate text-[12px] font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* ---------- Day cards ---------- */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {days.map((day, di) => {
            const color = accent(di);
            const groups = groupExercises(day.exercises);
            const count = realExercises(day.exercises).length;
            let row = 0;
            return (
              <section key={day._id ?? day.dayNumber} className="print-card overflow-hidden rounded-xl border border-zinc-300">
                {/* Day header bar */}
                <div className="flex items-stretch">
                  <div className="flex items-center bg-zinc-900 px-3 py-2 text-white">
                    <span className="font-display text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Day</span>
                    <span className="ml-1.5 font-display text-[18px] font-extrabold leading-none">{String(day.dayNumber).padStart(2, '0')}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2 bg-zinc-100 px-3">
                    <span className="truncate font-display text-[11.5px] font-bold uppercase tracking-wide">{day.dayTitle || 'Workout'}</span>
                    <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.15em] text-zinc-500">{count} ex</span>
                  </div>
                </div>
                <div className="h-[3px]" style={{ background: color }} />

                {/* Muscle groups */}
                <div className="pb-1.5">
                  {groups.map((group, gi) => (
                    <div key={gi} className={gi > 0 ? 'mt-1.5' : ''}>
                      {(group.title || gi > 0) && (
                        <div className="flex items-center gap-2 px-3 pb-1 pt-2">
                          {group.title && (
                            <span className="flex shrink-0 items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.2em]" style={{ color }}>
                              <span aria-hidden>✦</span>
                              {group.title}
                            </span>
                          )}
                          <span className="h-px flex-1" style={{ background: `${color}55` }} />
                        </div>
                      )}
                      <ul>
                        {group.items.map(({ exercise: ex }) => {
                          row++;
                          return (
                            <li
                              key={ex._id ?? `${di}-${row}`}
                              className={`grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-zinc-100 px-3 py-[5px] last:border-b-0 ${row % 2 === 0 ? 'bg-zinc-50' : ''}`}
                            >
                              {/* Pen check-box */}
                              <span className="h-3 w-3 rounded-[3px] border-[1.5px] border-zinc-400" aria-hidden />
                              <span className="min-w-0">
                                <span className="block truncate text-[11.5px] font-medium leading-tight">{ex.name}</span>
                                {ex.notes && <span className="block truncate text-[9px] italic leading-tight text-zinc-500">{ex.notes}</span>}
                              </span>
                              {ex.setsReps ? (
                                <span className="rounded-md border border-zinc-300 bg-white px-1.5 py-[1px] font-display text-[11px] font-bold tabular-nums tracking-wide">
                                  {ex.setsReps}
                                </span>
                              ) : (
                                <span />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* ---------- Trainer advice ---------- */}
        {plan.notes && (
          <div className="print-card mt-5 flex overflow-hidden rounded-xl border border-zinc-300">
            <div className="w-1.5 shrink-0" style={{ background: 'linear-gradient(180deg, #00d4ff, #8b5cf6)' }} />
            <div className="flex-1 bg-sky-50/60 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.22em] text-cyan-700">
                <Flame className="h-3 w-3" strokeWidth={2.5} />
                Trainer Advice
              </p>
              <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-zinc-700">{plan.notes}</p>
            </div>
          </div>
        )}

        {/* ---------- Footer ---------- */}
        <footer className="print-card mt-6 border-t border-zinc-300 pt-3 text-center">
          <p className="font-display text-[10.5px] font-extrabold uppercase tracking-[0.3em]">
            Consistency Creates Results <span className="text-zinc-400">·</span> {GYM.name}
          </p>
          <p className="mt-1 text-[8.5px] tracking-wide text-zinc-500">
            {GYM.phone} · {GYM.email} · Instagram {GYM.instagram} · {GYM.address}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default PrintableWorkoutSheet;
