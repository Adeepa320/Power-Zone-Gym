'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { monthName } from '@/lib/utils';

/** Compact month/year stepper with prev/next arrows. */
export function MonthPicker({
  month,
  year,
  onChange,
  disableFuture = true,
}: {
  month: number;
  year: number;
  onChange: (v: { month: number; year: number }) => void;
  disableFuture?: boolean;
}) {
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    onChange({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  return (
    <div className="glass inline-flex items-center gap-1 rounded-xl p-1">
      <button
        onClick={() => shift(-1)}
        className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-white"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <motion.span
        key={`${year}-${month}`}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-w-[132px] text-center text-sm font-semibold"
      >
        {monthName(month)} {year}
      </motion.span>
      <button
        onClick={() => shift(1)}
        disabled={disableFuture && (isCurrent || isFuture)}
        className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default MonthPicker;
