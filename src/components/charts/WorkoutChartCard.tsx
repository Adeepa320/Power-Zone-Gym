'use client';

import { motion } from 'framer-motion';
import { Dumbbell, ImageIcon, Pencil, Trash2, Users } from 'lucide-react';
import { CHART_CATEGORIES } from '@/lib/constants';
import { cardItem } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { ChartCategory, WorkoutChartDTO } from '@/types';

export function chartCategoryMeta(category: ChartCategory) {
  return CHART_CATEGORIES.find((c) => c.value === category) ?? CHART_CATEGORIES[CHART_CATEGORIES.length - 1];
}

export function ChartCategoryBadge({ category }: { category: ChartCategory }) {
  const meta = chartCategoryMeta(category);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: `${meta.color}1f`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

/** Library card for a workout chart. */
export function WorkoutChartCard({
  chart,
  onOpen,
  onEdit,
  onDelete,
}: {
  chart: WorkoutChartDTO;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const meta = chartCategoryMeta(chart.category);
  const assignedCount = chart.assignedTo?.length ?? 0;

  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -6 }}
      layout
      className="glass group relative flex flex-col overflow-hidden rounded-2xl"
    >
      {/* Header art: category-coloured gradient + pattern (or uploaded chart image) */}
      <button onClick={onOpen} className="relative h-32 overflow-hidden text-left" aria-label={`Open ${chart.title}`}>
        {chart.chartImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={chart.chartImage} alt={chart.title} className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105" />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${meta.color}40, transparent 70%)` }} />
            <div className="absolute inset-0 bg-dot-pattern bg-dots opacity-50" />
            <Dumbbell
              className="absolute -bottom-4 -right-4 h-28 w-28 rotate-[-20deg] opacity-20 transition duration-500 group-hover:rotate-0 group-hover:opacity-30"
              style={{ color: meta.color }}
            />
          </>
        )}
        <div className="absolute left-4 top-4">
          <ChartCategoryBadge category={chart.category} />
        </div>
        {chart.chartImage && (
          <span className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white backdrop-blur">
            <ImageIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <button onClick={onOpen} className="text-left">
          <h3 className="line-clamp-1 font-semibold transition group-hover:text-primary">{chart.title}</h3>
          {chart.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{chart.description}</p>}
        </button>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5" />
            {chart.exercises.length} exercises
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {assignedCount} assigned
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-[11px] text-muted/70">Updated {formatDate(chart.updatedAt)}</span>
          {(onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <button onClick={onEdit} className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-primary" aria-label="Edit chart">
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="rounded-lg p-2 text-muted transition hover:bg-danger/10 hover:text-danger" aria-label="Delete chart">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default WorkoutChartCard;
