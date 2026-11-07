'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate } from '@/lib/utils';
import type { WeightEntry } from '@/types';

/** Small area chart of a member's weight history. */
export function WeightChart({ history }: { history: WeightEntry[] }) {
  if (history.length < 2) {
    return <p className="py-8 text-center text-xs text-muted">Weight trend appears after the first update.</p>;
  }
  const data = history.map((h) => ({ date: formatDate(h.date, 'dd MMM'), weight: h.weight }));
  const weights = history.map((h) => h.weight);
  const min = Math.floor(Math.min(...weights) - 2);
  const max = Math.ceil(Math.max(...weights) + 2);

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff88" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis domain={[min, max]} stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#a0a0b0' }}
            formatter={(v: number) => [`${v} kg`, 'Weight']}
          />
          <Area type="monotone" dataKey="weight" stroke="#00ff88" strokeWidth={2.5} fill="url(#wt)" animationDuration={1200} dot={{ r: 3, fill: '#00ff88' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WeightChart;
