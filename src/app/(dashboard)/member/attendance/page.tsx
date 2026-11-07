'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getDaysInMonth } from 'date-fns';
import { CalendarCheck, CalendarDays, Clock, Flame, Medal, Trophy } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, staggerContainer } from '@/components/ui/Card';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Skeleton, SkeletonStats } from '@/components/ui/Loader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AttendanceCalendar } from '@/components/dashboard/AttendanceCalendar';
import { currentMonthYear, formatDate, formatTime, monthLabel } from '@/lib/utils';
import type { MemberAttendance } from '@/types';

function streakMessage(streak: number) {
  if (streak === 0) return 'Check in today to start a new streak!';
  if (streak < 3) return 'Great start — keep the momentum going!';
  if (streak < 7) return 'You’re on fire! Don’t break the chain.';
  if (streak < 14) return 'A full week+ of consistency. Beast mode!';
  return 'Legendary discipline. Absolute machine! 🏆';
}

export default function MemberAttendancePage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(currentMonthYear());
  const { data, isLoading } = useFetch<MemberAttendance>(user ? `/api/attendance/member/${user.id}?month=${period.month}&year=${period.year}` : null);

  const now = currentMonthYear();
  const isCurrent = period.month === now.month && period.year === now.year;
  const daysInPeriod = isCurrent ? new Date().getDate() : getDaysInMonth(new Date(period.year, period.month - 1));
  const rate = data ? Math.round((data.totalInPeriod / Math.max(daysInPeriod, 1)) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Attendance Log"
        description="Every visit counts. Track your consistency."
        breadcrumbs={[{ label: 'Dashboard', href: '/member' }, { label: 'Attendance' }]}
        actions={<MonthPicker month={period.month} year={period.year} onChange={setPeriod} />}
      />

      {isLoading || !data ? (
        <div className="space-y-6">
          <SkeletonStats count={3} />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Streak hero */}
            <Card className="overflow-hidden border-warning/30 bg-gradient-to-br from-warning/15 via-[#ff6b35]/10 to-transparent">
              <div className="flex items-center gap-5">
                <motion.div
                  animate={data.streak > 0 ? { scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] } : undefined}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-warning to-[#ff6b35] text-ink-950 shadow-[0_0_32px_rgba(255,170,0,0.4)]"
                >
                  <Flame className="h-10 w-10" />
                </motion.div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Current Streak</p>
                  <p className="font-display text-4xl font-extrabold">
                    <AnimatedCounter value={data.streak} /> <span className="text-lg font-semibold text-muted">days</span>
                  </p>
                  <p className="mt-1 text-xs text-white/80">{streakMessage(data.streak)}</p>
                </div>
              </div>
            </Card>
            <StatsCard
              label={isCurrent ? 'Days This Month' : `Days in ${monthLabel(period.month, period.year)}`}
              value={data.totalInPeriod}
              icon={CalendarCheck}
              accent="success"
              hint={`${rate}% of ${isCurrent ? 'days so far' : 'the month'}`}
            />
            <div className="grid grid-cols-2 gap-4">
              <StatsCard label="All Time" value={data.totalAllTime} icon={Trophy} accent="primary" />
              <StatsCard label="Best Streak" value={data.longestStreak} icon={Medal} accent="violet" hint="days" />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title={monthLabel(period.month, period.year)} description="Attended days are highlighted in green" icon={<CalendarDays />} />
              <AttendanceCalendar month={period.month} year={period.year} attended={data.records.map((r) => ({ date: r.date, checkInTime: r.checkInTime }))} />
            </Card>
            <Card>
              <CardHeader title="Check-in Times" icon={<Clock />} />
              {data.records.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <CalendarDays className="h-10 w-10 text-muted/40" />
                  <p className="mt-3 text-sm text-muted">No visits recorded this month.</p>
                </div>
              ) : (
                <ul className="scrollbar-thin max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {data.records.map((r, i) => (
                    <motion.li
                      key={r._id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.5) }}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                    >
                      <span>{formatDate(r.date, 'EEE, dd MMM')}</span>
                      <span className="font-mono text-xs text-success">{formatTime(r.checkInTime)}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </motion.div>
      )}
    </>
  );
}
