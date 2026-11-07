'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { BarChart3, CalendarCheck, CalendarDays, Crown, Flame, Search, TrendingUp, UserCheck, Users } from 'lucide-react';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { Skeleton, SkeletonStats } from '@/components/ui/Loader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AttendanceCalendar } from '@/components/dashboard/AttendanceCalendar';
import { CategoryBadge } from '@/components/dashboard/MemberTable';
import { categoryLabel, currentMonthYear, formatDate, formatTime, monthLabel } from '@/lib/utils';
import type { AttendanceOverview, MemberAttendance, MemberSummary } from '@/types';

export default function AdminAttendancePage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [period, setPeriod] = useState(currentMonthYear());
  const [lookupId, setLookupId] = useState('');
  const [lookupPeriod, setLookupPeriod] = useState(currentMonthYear());
  const [checkInId, setCheckInId] = useState('');
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('');

  const { data, isLoading, mutate } = useFetch<AttendanceOverview>(
    `/api/attendance?date=${date}&month=${period.month}&year=${period.year}`,
    { refreshInterval: 30_000 },
  );
  const { data: members } = useFetch<MemberSummary[]>('/api/members?lite=1');
  const { data: lookup, isLoading: lookupLoading } = useFetch<MemberAttendance>(
    lookupId ? `/api/attendance/member/${lookupId}?month=${lookupPeriod.month}&year=${lookupPeriod.year}` : null,
  );

  const isToday = date === format(new Date(), 'yyyy-MM-dd');
  const lookupMember = members?.find((m) => m._id === lookupId);
  const busiest = useMemo(() => {
    if (!data) return null;
    return data.daily.reduce((best, d) => (d.count > (best?.count ?? 0) ? d : best), null as null | { date: string; count: number });
  }, [data]);

  const todayList = (data?.today ?? []).filter((a) => {
    const m = a.member as MemberSummary | null;
    return !filter || m?.name.toLowerCase().includes(filter.toLowerCase());
  });

  async function manualCheckIn() {
    if (!checkInId) return;
    setChecking(true);
    try {
      await apiRequest('/api/attendance', 'POST', { memberId: checkInId });
      toast.success(`${members?.find((m) => m._id === checkInId)?.name ?? 'Member'} checked in`);
      setCheckInId('');
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setChecking(false);
    }
  }

  const memberOptions = (members ?? []).map((m) => ({ value: m._id, label: `${m.name} · ${categoryLabel(m.membershipCategory)}` }));

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Daily check-ins and monthly trends."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Attendance' }]}
        actions={<MonthPicker month={period.month} year={period.year} onChange={setPeriod} />}
      />

      {!data ? (
        <SkeletonStats />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label={isToday ? "Today's Check-ins" : `Check-ins ${formatDate(date, 'dd MMM')}`} value={data.today.length} icon={UserCheck} accent="primary" />
          <StatsCard label="Average Daily" value={data.averageDaily} format={(n) => n.toFixed(1)} icon={TrendingUp} accent="success" hint={monthLabel(data.month, data.year)} />
          <StatsCard label="Total This Month" value={data.totalThisMonth} icon={BarChart3} accent="violet" hint="All check-ins" />
          <StatsCard
            label="Busiest Day"
            display={busiest ? formatDate(busiest.date, 'dd MMM') : '—'}
            icon={Flame}
            accent="warning"
            hint={busiest ? `${busiest.count} check-ins` : 'No check-ins yet'}
          />
        </motion.div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Daily list */}
        <Card className="lg:col-span-3" initial="hidden" animate="show">
          <CardHeader
            title={isToday ? "Today's Attendance" : `Attendance on ${formatDate(date)}`}
            description={`${data?.today.length ?? 0} members checked in`}
            icon={<CalendarCheck />}
            action={
              <input
                type="date"
                value={date}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm focus:border-primary/60 focus:outline-none"
              />
            }
          />

          {isToday && (
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:flex-row">
              <Select wrapperClassName="flex-1" value={checkInId} onChange={(e) => setCheckInId(e.target.value)} placeholder="Check in a member manually…" options={memberOptions} />
              <Button onClick={manualCheckIn} loading={checking} disabled={!checkInId} icon={<UserCheck className="h-4 w-4" />}>
                Check in
              </Button>
            </div>
          )}

          <Input placeholder="Filter by name…" icon={<Search />} value={filter} onChange={(e) => setFilter(e.target.value)} wrapperClassName="mb-3" />

          {isLoading && !data ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : todayList.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted/40" />
              <p className="mt-3 text-sm text-muted">No check-ins {filter ? 'match this filter' : isToday ? 'yet today' : 'on this day'}.</p>
            </div>
          ) : (
            <ul className="scrollbar-thin max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {todayList.map((a, i) => {
                const m = a.member as MemberSummary | null;
                return (
                  <motion.li
                    key={a._id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
                  >
                    {m ? <Avatar name={m.name} src={m.profileImage} /> : <Avatar name="?" />}
                    <div className="min-w-0 flex-1">
                      {m ? (
                        <Link href={`/admin/members/${m._id}`} className="truncate font-medium hover:text-primary">
                          {m.name}
                        </Link>
                      ) : (
                        <p className="text-muted">Deleted member</p>
                      )}
                      {m && (
                        <div className="mt-0.5">
                          <CategoryBadge category={m.membershipCategory} />
                        </div>
                      )}
                    </div>
                    <span className="rounded-lg bg-success/10 px-2.5 py-1 font-mono text-xs text-success">{formatTime(a.checkInTime)}</span>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Top members */}
        <Card className="lg:col-span-2" initial="hidden" animate="show">
          <CardHeader title="Most Active Members" description={monthLabel(period.month, period.year)} icon={<Crown />} />
          {!data ? (
            <Skeleton className="h-60 rounded-xl" />
          ) : data.topMembers.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No attendance this month yet.</p>
          ) : (
            <ol className="space-y-3">
              {data.topMembers.map((t, i) => {
                const pct = Math.round((t.count / data.topMembers[0].count) * 100);
                const medal = ['text-warning', 'text-white/80', 'text-[#ff6b35]'][i] ?? 'text-muted';
                return (
                  <motion.li key={t.member._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
                    <span className={`w-5 text-center font-display text-sm font-bold ${medal}`}>{i + 1}</span>
                    <Avatar name={t.member.name} src={t.member.profileImage} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <Link href={`/admin/members/${t.member._id}`} className="truncate font-medium hover:text-primary">
                          {t.member.name}
                        </Link>
                        <span className="shrink-0 text-xs text-muted">{t.count} days</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-violet" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }} />
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="mt-6" initial="hidden" animate="show">
        <CardHeader title="Daily Attendance Heatmap" description={`Check-ins per day · ${monthLabel(period.month, period.year)}`} icon={<BarChart3 />} />
        {data ? <AttendanceCalendar month={period.month} year={period.year} counts={data.daily} /> : <Skeleton className="h-80 rounded-xl" />}
      </Card>

      {/* Member lookup */}
      <Card className="mt-6" initial="hidden" animate="show">
        <CardHeader title="Member Attendance Lookup" description="Search any member's attendance history" icon={<Users />} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select wrapperClassName="flex-1" label="Member" icon={<Search />} value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="Select a member…" options={memberOptions} />
          {lookupId && <MonthPicker month={lookupPeriod.month} year={lookupPeriod.year} onChange={setLookupPeriod} />}
        </div>
        {lookupId && (
          <div className="mt-6">
            {lookupLoading && !lookup ? (
              <Skeleton className="h-72 rounded-xl" />
            ) : (
              lookup && (
                <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                  <div className="space-y-3">
                    {lookupMember && (
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <Avatar name={lookupMember.name} src={lookupMember.profileImage} />
                        <div className="min-w-0">
                          <Link href={`/admin/members/${lookupMember._id}`} className="truncate font-medium hover:text-primary">
                            {lookupMember.name}
                          </Link>
                          <p className="truncate text-xs text-muted">{lookupMember.email}</p>
                        </div>
                      </div>
                    )}
                    {[
                      { label: 'This month', value: lookup.totalInPeriod },
                      { label: 'All time', value: lookup.totalAllTime },
                      { label: 'Current streak', value: `${lookup.streak} days` },
                      { label: 'Longest streak', value: `${lookup.longestStreak} days` },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm">
                        <span className="text-muted">{s.label}</span>
                        <span className="font-semibold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <AttendanceCalendar month={lookupPeriod.month} year={lookupPeriod.year} attended={lookup.records.map((r) => ({ date: r.date, checkInTime: r.checkInTime }))} />
                </div>
              )
            )}
          </div>
        )}
      </Card>
    </>
  );
}
