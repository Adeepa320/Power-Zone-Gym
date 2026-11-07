'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardCheck, ClipboardList, ClipboardX, Filter, Plus, Search, Users } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cardItem, staggerContainer } from '@/components/ui/Card';
import { Skeleton, SkeletonStats } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CategoryBadge } from '@/components/dashboard/MemberTable';
import { dayColor } from '@/components/workout/PlanViewer';
import { MEMBERSHIP_CATEGORIES } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import type { MemberPlanListItem } from '@/types';

type StatusFilter = 'all' | 'with' | 'without';

export default function WorkoutPlansPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  const params = new URLSearchParams();
  if (debounced) params.set('search', debounced);
  if (category) params.set('category', category);
  const { data, error, isLoading, mutate } = useFetch<MemberPlanListItem[]>(`/api/workout-plans?${params.toString()}`);

  const withPlan = (data ?? []).filter((i) => i.plan).length;
  const withoutPlan = (data ?? []).length - withPlan;
  const items = (data ?? [])
    .filter((i) => (status === 'with' ? i.plan : status === 'without' ? !i.plan : true))
    // Members who still need a plan first, then most recently updated.
    .sort((a, b) => {
      if (!a.plan !== !b.plan) return a.plan ? 1 : -1;
      return (b.plan?.updatedAt ?? '').localeCompare(a.plan?.updatedAt ?? '') || a.member.name.localeCompare(b.member.name);
    });

  return (
    <>
      <PageHeader
        title="Workout Plans"
        description="Every member gets their own day-by-day routine — just like your WhatsApp charts, but organised."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Workout Plans' }]}
      />

      {!data && !error ? (
        <SkeletonStats count={3} />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatsCard label="Active Members" value={(data ?? []).length} icon={Users} accent="primary" onClick={() => setStatus('all')} />
          <StatsCard label="Have a Plan" value={withPlan} icon={ClipboardCheck} accent="success" onClick={() => setStatus('with')} />
          <StatsCard label="Need a Plan" value={withoutPlan} icon={ClipboardX} accent="warning" hint={withoutPlan ? 'Tap to see who' : 'Everyone is covered 🎉'} onClick={() => setStatus('without')} />
        </motion.div>
      )}

      <div className="mb-6 mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="glass inline-flex rounded-xl p-1">
          {(
            [
              ['all', 'All'],
              ['without', 'Need a plan'],
              ['with', 'Have a plan'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={cn('relative rounded-lg px-4 py-2 text-sm font-medium transition', status === value ? 'text-ink-950' : 'text-muted hover:text-white')}
            >
              {status === value && <motion.span layoutId="plan-status" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Input placeholder="Search member…" icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select icon={<Filter />} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="All categories" options={MEMBERSHIP_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
        </div>
      </div>

      {error ? (
        <EmptyState icon={ClipboardList} title="Could not load plans" description={error.message} action={<Button onClick={() => mutate()}>Retry</Button>} />
      ) : isLoading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={status === 'without' ? 'Every member has a plan' : 'No members found'}
          description={status === 'without' ? 'Nice work — all active members have a personal routine.' : 'Try a different search or filter.'}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map(({ member, plan }) => (
            <motion.div key={member._id} variants={cardItem} whileHover={{ y: -4 }}>
              <Link
                href={`/admin/charts/${member._id}`}
                className={cn(
                  'glass group flex h-full flex-col rounded-2xl p-5 transition-colors hover:border-white/20',
                  !plan && 'border-dashed border-warning/30',
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.profileImage} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold transition group-hover:text-primary">{member.name}</p>
                    <p className="truncate text-xs text-muted">{member.fitnessGoal ?? member.email}</p>
                  </div>
                  <CategoryBadge category={member.membershipCategory} />
                </div>

                {plan ? (
                  <div className="mt-4 flex flex-1 flex-col">
                    <p className="line-clamp-1 text-sm font-medium">{plan.planTitle}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plan.dayTitles.map((t, i) => (
                        <span key={i} className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: `${dayColor(i)}1f`, color: dayColor(i) }}>
                          D{i + 1}
                          {t ? ` · ${t}` : ''}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
                      <span>
                        {plan.dayCount} days · {plan.exerciseCount} exercises
                      </span>
                      <span>Updated {formatDate(plan.updatedAt, 'dd MMM')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-1 items-center justify-between rounded-xl bg-warning/[0.06] px-4 py-3">
                    <span className="text-sm text-warning">No plan yet</span>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">
                      <Plus className="h-4 w-4" /> Create
                    </span>
                  </div>
                )}
                {plan && (
                  <span className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    Open editor <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}
