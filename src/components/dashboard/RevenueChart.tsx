'use client';

import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, LineChart } from 'lucide-react';
import { formatCompact, formatCurrency, cn } from '@/lib/utils';

type Point = { label: string; revenue: number; payments: number };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: Point }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-sm">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold text-primary">{formatCurrency(p.revenue)}</p>
      <p className="text-xs text-muted">{p.payments} payments</p>
    </div>
  );
}

/** Six-month revenue chart with line/bar toggle. Recharts animates the drawing on mount. */
export function RevenueChart({ data }: { data: Point[] }) {
  const [type, setType] = useState<'area' | 'bar'>('area');

  const axisProps = {
    stroke: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  } as const;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
          {(
            [
              ['area', LineChart],
              ['bar', BarChart3],
            ] as const
          ).map(([t, Icon]) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn('rounded-md p-1.5 transition', type === t ? 'bg-primary/20 text-primary' : 'text-muted hover:text-white')}
              aria-label={`${t} chart`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rev-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v: number) => formatCompact(v)} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(0,212,255,0.3)' }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="url(#rev-stroke)"
                strokeWidth={3}
                fill="url(#rev-fill)"
                animationDuration={1400}
                dot={{ r: 4, fill: '#0a0a0a', stroke: '#00d4ff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#00d4ff' }}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v: number) => formatCompact(v)} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="revenue" fill="url(#rev-bar)" radius={[8, 8, 0, 0]} animationDuration={1200} maxBarSize={48} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueChart;
