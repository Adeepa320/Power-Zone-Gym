'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CalendarCheck, CalendarHeart, ClipboardList, CreditCard, Dumbbell, Flame, Quote, Wallet } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonStats, Skeleton } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CheckInButton } from '@/components/dashboard/CheckInButton';
import { PaymentStatusBadge } from '@/components/dashboard/PaymentStatusBadge';
import { ChartCategoryBadge } from '@/components/charts/WorkoutChartCard';
import { MEMBERSHIP_CATEGORIES, MOTIVATIONAL_QUOTES } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { MemberStats } from '@/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function MemberDashboardPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useFetch<MemberStats>('/api/dashboard/stats');

  // Quote changes daily (deterministic, so it doesn't flicker on re-render).
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const quote = MOTIVATIONAL_QUOTES[dayIndex % MOTIVATIONAL_QUOTES.length];

  if (error) {
    return <EmptyState icon={AlertCircle} title="Could not load your dashboard" description={error.message} action={<Button onClick={() => mutate()}>Retry</Button>} />;
  }

  const plan = data ? MEMBERSHIP_CATEGORIES.find((c) => c.value === data.membershipCategory) : null;
  const paid = data?.currentPayment?.paymentStatus === 'paid';

  return (
    <>
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-violet/15 to-[#ff6b35]/10 p-6 sm:p-8"
      >
        <div className="absolute inset-0 bg-dot-pattern bg-dots opacity-40" />
        <motion.div className="absolute -right-10 -top-10 text-white/[0.06]" animate={{ rotate: [0, 15, 0] }} transition={{ duration: 8, repeat: Infinity }}>
          <Dumbbell className="h-48 w-48" />
        </motion.div>
        <div className="relative">
          <p className="text-sm text-muted" suppressHydrationWarning>
            {greeting()},
          </p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
            {data ? data.name.split(' ')[0] : <Skeleton className="inline-block h-9 w-40 align-middle" />} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-4 flex max-w-2xl items-start gap-2 text-sm italic text-white/80 sm:text-base">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {quote}
          </p>
        </div>
      </motion.div>

      {isLoading || !data ? (
        <div className="space-y-6">
          <SkeletonStats />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="Days This Month"
              value={data.daysThisMonth}
              icon={CalendarCheck}
              accent="primary"
              hint={
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-warning" /> {data.streak}-day streak
                </span>
              }
              onClick={() => router.push('/member/attendance')}
            />
            <StatsCard
              label="This Month's Fee"
              display={<PaymentStatusBadge status={data.currentPayment?.paymentStatus} />}
              icon={CreditCard}
              accent={paid ? 'success' : 'warning'}
              hint={paid ? `Paid ${formatDate(data.currentPayment?.paidAt)}` : `${formatCurrency(data.monthlyFee)} due`}
              onClick={() => router.push('/member/payments')}
            />
            <StatsCard
              label="My Membership"
              display={<span className="text-2xl">{plan ? `${plan.emoji} ${plan.short}` : '—'}</span>}
              icon={Wallet}
              accent="violet"
              hint={`${formatCurrency(data.monthlyFee)} / month`}
            />
            <StatsCard label="Member Since" display={<span className="text-2xl">{formatDate(data.memberSince, 'MMM yyyy')}</span>} icon={CalendarHeart} accent="success" hint={formatDate(data.memberSince)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader title="Today's Check-in" description={formatDate(new Date(), 'EEEE, dd MMMM')} icon={<CalendarCheck />} />
              <CheckInButton checkedIn={data.checkedInToday} checkInTime={data.checkInTime} onCheckedIn={() => mutate()} />
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader
                title="My Workout Chart"
                icon={<ClipboardList />}
                action={
                  data.assignedChart && (
                    <Link href="/member/my-chart" className="text-xs text-primary hover:underline">
                      View full chart
                    </Link>
                  )
                }
              />
              {data.assignedChart ? (
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <ChartCategoryBadge category={data.assignedChart.category} />
                    <span className="text-xs text-muted">Updated {formatDate(data.assignedChart.updatedAt)}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{data.assignedChart.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {data.assignedChart.exercises.slice(0, 5).map((e, i) => (
                      <motion.li
                        key={e._id ?? i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                      >
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
                          {e.name}
                        </span>
                        <span className="text-xs text-muted">
                          {e.sets} × {e.reps}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  {data.assignedChart.exercises.length > 5 && <p className="mt-2 text-xs text-muted">+{data.assignedChart.exercises.length - 5} more exercises</p>}
                  <Link href="/member/my-chart" className="mt-5 inline-block">
                    <Button variant="outline" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                      Open my chart
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="rounded-2xl bg-white/5 p-4 text-muted">
                    <ClipboardList className="h-8 w-8" />
                  </motion.div>
                  <p className="mt-4 font-medium">No chart assigned yet</p>
                  <p className="mt-1 max-w-xs text-sm text-muted">Your trainer will assign a personalised workout chart soon. Ask at the front desk!</p>
                </div>
              )}
            </Card>
          </div>

          {!paid && data.currentPayment && (
            <Card className="flex flex-col items-start gap-4 border-warning/30 bg-warning/[0.06] sm:flex-row sm:items-center">
              <AlertCircle className="h-6 w-6 shrink-0 text-warning" />
              <div className="flex-1">
                <p className="font-semibold">Your membership fee for this month is due</p>
                <p className="text-sm text-muted">{formatCurrency(data.currentPayment.amount)} — pay online now or at the front desk.</p>
              </div>
              <Link href="/member/payments">
                <Button variant="primary" iconRight={<ArrowRight className="h-4 w-4" />}>
                  Pay now
                </Button>
              </Link>
            </Card>
          )}
        </motion.div>
      )}
    </>
  );
}
