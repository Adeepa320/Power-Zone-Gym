'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Dumbbell, Maximize2, MessageSquareText, Repeat, Timer, UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import type { WorkoutChartDTO } from '@/types';
import { ChartCategoryBadge, chartCategoryMeta } from './WorkoutChartCard';

/** Full, organised display of a workout chart (used by members and admins). */
export function ChartViewer({ chart, compact = false }: { chart: WorkoutChartDTO; compact?: boolean }) {
  const [imageOpen, setImageOpen] = useState(false);
  const meta = chartCategoryMeta(chart.category);
  const trainer = typeof chart.createdBy === 'object' ? chart.createdBy?.name : undefined;
  const totalSets = chart.exercises.reduce((sum, e) => sum + e.sets, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8">
        <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${meta.color}30, transparent 65%)` }} />
        <div className="absolute inset-0 bg-grid-pattern bg-[length:28px_28px] opacity-40" />
        <Dumbbell className="absolute -right-6 -top-6 h-40 w-40 rotate-12 opacity-10" style={{ color: meta.color }} />
        <div className="relative">
          <ChartCategoryBadge category={chart.category} />
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{chart.title}</h2>
          {chart.description && <p className="mt-2 max-w-2xl text-sm text-muted">{chart.description}</p>}
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-primary" /> {chart.exercises.length} exercises
            </span>
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
              <Repeat className="h-3.5 w-3.5 text-success" /> {totalSets} total sets
            </span>
            {trainer && (
              <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5">
                <UserRound className="h-3.5 w-3.5 text-warning" /> By {trainer}
              </span>
            )}
            <span className="glass rounded-full px-3 py-1.5 text-muted">Updated {formatDate(chart.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Chart image (e.g. the one shared on WhatsApp) */}
      {chart.chartImage && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <p className="text-sm font-semibold">Chart image</p>
            <div className="flex gap-1">
              <a
                href={chart.chartImage}
                download={`${chart.title.replace(/\s+/g, '-').toLowerCase()}.jpg`}
                className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-white"
                aria-label="Download image"
              >
                <Download className="h-4 w-4" />
              </a>
              <button onClick={() => setImageOpen(true)} className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-white" aria-label="View full size">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button onClick={() => setImageOpen(true)} className="block w-full bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={chart.chartImage} alt={chart.title} className={`mx-auto w-auto object-contain ${compact ? 'max-h-64' : 'max-h-[520px]'}`} />
          </button>
        </motion.div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {chart.exercises.map((ex, i) => (
          <motion.div
            key={ex._id ?? `${ex.name}-${i}`}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass group flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:p-5"
          >
            <div className="flex items-center gap-4 sm:flex-1">
              {ex.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ex.imageUrl} alt={ex.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold"
                  style={{ background: `${meta.color}1f`, color: meta.color }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold">{ex.name}</p>
                {ex.notes && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
                    <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                    {ex.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-[300px]">
              <Stat label="Sets" value={String(ex.sets)} />
              <Stat label="Reps" value={ex.reps} />
              <Stat label="Rest" value={ex.restTime} icon={<Timer className="h-3 w-3" />} />
            </div>
          </motion.div>
        ))}
      </div>

      <Modal open={imageOpen} onClose={() => setImageOpen(false)} title={chart.title} size="xl">
        {chart.chartImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={chart.chartImage} alt={chart.title} className="mx-auto max-h-[75vh] w-auto rounded-xl object-contain" />
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

export default ChartViewer;
