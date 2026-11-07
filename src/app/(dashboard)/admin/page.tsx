'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, Banknote, CalendarCheck, Clock3, TrendingUp, UserPlus, Users, Wallet, Zap } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, SkeletonStats } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { MEMBERSHIP_CATEGORIES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { AdminStats } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useFetch<AdminStats>('/api/dashboard/stats', { refreshInterval: 60_000 });
  const [cashOpen, setCashOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const totalCategory = data?.categoryBreakdown.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <>
      <PageHeader
        title={<>Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] ?? 'Admin'}</span></>}
        description="Here's what's happening at the gym today."
        actions={
          <>
            <Button variant="secondary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
              Add member
            </Button>
            <Button icon={<Banknote className="h-4 w-4" />} onClick={() => setCashOpen(true)}>
              Mark cash payment
            </Button>
          </>
        }
      />

      {error && <EmptyState icon={AlertCircle} title="Could not load dashboard" description={error.message} action={<Button onClick={() => mutate()}>Retry</Button>} />}

      {isLoading || !data ? (
        !error && (
          <div className="space-y-6">
            <SkeletonStats />
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        )
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="Active Members"
              value={data.activeMembers}
              icon={Users}
              accent="primary"
              hint={`${data.totalMembers} total registered`}
              onClick={() => router.push('/admin/members')}
            />
            <StatsCard
              label="Revenue This Month"
              value={data.revenueThisMonth}
              format={(n) => formatCurrency(n)}
              icon={TrendingUp}
              accent="success"
              hint="Collected (online + cash)"
              onClick={() => router.push('/admin/payments')}
            />
            <StatsCard
              label="Pending Payments"
              value={data.pendingThisMonth.count}
              icon={Clock3}
              accent="warning"
              hint={`${formatCurrency(data.pendingThisMonth.amount)} outstanding`}
              onClick={() => router.push('/admin/payments?status=pending')}
            />
            <StatsCard
              label="Today's Attendance"
              value={data.todayAttendance}
              icon={CalendarCheck}
              accent="violet"
              hint="Members checked in today"
              onClick={() => router.push('/admin/attendance')}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Revenue" description="Paid memberships over the last 6 months" icon={<Wallet />} />
              <RevenueChart data={data.revenueTrend} />
            </Card>

            <Card>
              <CardHeader title="Recent Activity" description="Registrations, payments & check-ins" icon={<Activity />} />
              <div className="scrollbar-thin -mx-2 max-h-[340px] overflow-y-auto">
                <ActivityFeed items={data.recentActivity} />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Quick Actions" icon={<Zap />} />
              <div className="grid gap-2">
                {[
                  { label: 'Mark cash payment', icon: Banknote, onClick: () => setCashOpen(true), color: 'text-success' },
                  { label: 'Add new member', icon: UserPlus, onClick: () => setAddOpen(true), color: 'text-primary' },
                  { label: 'View pending payments', icon: Clock3, onClick: () => router.push('/admin/payments?status=pending'), color: 'text-warning' },
                  { label: "Today's check-ins", icon: CalendarCheck, onClick: () => router.push('/admin/attendance'), color: 'text-[#a78bfa]' },
                ].map((a) => (
                  <motion.button
                    key={a.label}
                    whileHover={{ x: 4 }}
                    onClick={a.onClick}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left text-sm transition hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    <a.icon className={`h-4 w-4 ${a.color}`} />
                    {a.label}
                  </motion.button>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Membership Mix"
                description="Active members by category"
                icon={<Users />}
                action={
                  <Link href="/admin/members" className="text-xs text-primary hover:underline">
                    View all
                  </Link>
                }
              />
              <div className="space-y-5">
                {MEMBERSHIP_CATEGORIES.map((c, i) => {
                  const count = data.categoryBreakdown.find((x) => x.category === c.value)?.count ?? 0;
                  const pct = Math.round((count / totalCategory) * 100);
                  return (
                    <div key={c.value}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{c.emoji}</span> {c.label}
                        </span>
                        <span className="text-muted">
                          <span className="font-semibold text-white">{count}</span> · {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${c.color}, ${c.color}99)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      <Modal open={cashOpen} onClose={() => setCashOpen(false)} title="Mark cash payment" description="Record a payment received at the front desk.">
        <PaymentForm
          onCancel={() => setCashOpen(false)}
          onSuccess={() => {
            setCashOpen(false);
            mutate();
          }}
        />
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Register new member" size="lg">
        <RegisterForm
          mode="admin"
          onSuccess={(m) => {
            setAddOpen(false);
            mutate();
            router.push(`/admin/members/${m._id}`);
          }}
        />
      </Modal>
    </>
  );
}
