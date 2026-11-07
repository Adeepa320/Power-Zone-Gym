'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AlertCircle, Banknote, CheckCircle2, Clock3, CreditCard, Globe, RefreshCw, Search, Target, Wallet } from 'lucide-react';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { Table, type Column } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Loader, SkeletonStats, SkeletonTable } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PaymentStatusBadge } from '@/components/dashboard/PaymentStatusBadge';
import { CategoryBadge } from '@/components/dashboard/MemberTable';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { MEMBERSHIP_CATEGORIES } from '@/lib/constants';
import { cn, currentMonthYear, formatCurrency, formatDate, monthLabel } from '@/lib/utils';
import type { MemberSummary, MonthlySummary, PaymentDTO, PaymentStatus } from '@/types';

const STATUS_TABS: { value: '' | PaymentStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

function PaymentsContent() {
  const params = useSearchParams();
  const [period, setPeriod] = useState(currentMonthYear());
  const [status, setStatus] = useState<'' | PaymentStatus>((params.get('status') as PaymentStatus) ?? '');
  const [category, setCategory] = useState('');
  const [method, setMethod] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [cash, setCash] = useState<{ open: boolean; memberId?: string }>({ open: false });
  const [generating, setGenerating] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams({ month: String(period.month), year: String(period.year) });
    if (status) p.set('status', status);
    if (category) p.set('category', category);
    if (method) p.set('method', method);
    if (debounced) p.set('search', debounced);
    return p.toString();
  }, [period, status, category, method, debounced]);

  const { data: payments, isLoading, error, mutate } = useFetch<PaymentDTO[]>(`/api/payments?${query}`);
  const { data: summary, mutate: mutateSummary } = useFetch<MonthlySummary>(
    `/api/payments/monthly-summary?month=${period.month}&year=${period.year}`,
  );

  const refresh = () => {
    mutate();
    mutateSummary();
  };

  async function generateDues() {
    setGenerating(true);
    try {
      const res = await apiRequest<{ created: number }>('/api/payments', 'POST', period);
      toast.success(res.created > 0 ? `Generated ${res.created} payment records` : 'All active members already have a record');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not generate dues');
    } finally {
      setGenerating(false);
    }
  }

  const collectionRate = summary && summary.totalExpected > 0 ? Math.round((summary.totalCollected / summary.totalExpected) * 100) : 0;

  const columns: Column<PaymentDTO>[] = [
    {
      key: 'member',
      header: 'Member',
      primary: true,
      sortValue: (p) => (p.member as MemberSummary)?.name,
      render: (p) => {
        const m = p.member as MemberSummary | null;
        if (!m) return <span className="text-muted">Deleted member</span>;
        return (
          <Link href={`/admin/members/${m._id}`} className="flex items-center gap-3 hover:text-primary" onClick={(e) => e.stopPropagation()}>
            <Avatar name={m.name} src={m.profileImage} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium">{m.name}</p>
              <p className="truncate text-xs text-muted">{m.phone}</p>
            </div>
          </Link>
        );
      },
    },
    {
      key: 'category',
      header: 'Category',
      sortValue: (p) => (p.member as MemberSummary)?.membershipCategory,
      render: (p) => ((p.member as MemberSummary)?.membershipCategory ? <CategoryBadge category={(p.member as MemberSummary).membershipCategory} /> : '—'),
    },
    { key: 'amount', header: 'Amount', sortValue: (p) => p.amount, render: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span> },
    {
      key: 'method',
      header: 'Method',
      render: (p) =>
        p.paymentMethod ? (
          <span className="inline-flex items-center gap-1.5 text-sm capitalize text-muted">
            {p.paymentMethod === 'online' ? <Globe className="h-3.5 w-3.5 text-primary" /> : <Banknote className="h-3.5 w-3.5 text-success" />}
            {p.paymentMethod}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (p) => ({ overdue: 0, pending: 1, paid: 2 })[p.paymentStatus],
      render: (p) => <PaymentStatusBadge status={p.paymentStatus} />,
    },
    {
      key: 'date',
      header: 'Date',
      sortValue: (p) => p.paidAt ?? p.createdAt,
      render: (p) => (
        <span className="text-xs text-muted">
          {p.paidAt ? formatDate(p.paidAt) : `Due ${formatDate(p.createdAt)}`}
          {p.paymentMethod === 'cash' && typeof p.markedBy === 'object' && p.markedBy && <span className="block">by {p.markedBy.name}</span>}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      hideOnMobile: false,
      render: (p) =>
        p.paymentStatus !== 'paid' && typeof p.member === 'object' && p.member ? (
          <Button
            size="sm"
            variant="outline"
            icon={<Banknote className="h-3.5 w-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              setCash({ open: true, memberId: (p.member as MemberSummary)._id });
            }}
          >
            Mark cash
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Monthly collections, online & cash payments."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Payments' }]}
        actions={
          <>
            <MonthPicker month={period.month} year={period.year} onChange={setPeriod} />
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} loading={generating} onClick={generateDues} title="Create pending records for active members">
              Generate dues
            </Button>
            <Button icon={<Banknote className="h-4 w-4" />} onClick={() => setCash({ open: true })}>
              Mark cash payment
            </Button>
          </>
        }
      />

      {/* Summary */}
      {!summary ? (
        <SkeletonStats />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* Prominent full payment total */}
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-violet/10 to-transparent">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Collected · {monthLabel(summary.month, summary.year)}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-gradient">
              <AnimatedCounter value={summary.totalCollected} format={(n) => formatCurrency(n)} />
            </p>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>Collection rate</span>
                <span className="font-semibold text-white">{collectionRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-success to-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${collectionRate}%` }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="mt-3 flex gap-4 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3 text-primary" /> Online {formatCurrency(summary.byMethod.online)}
                </span>
                <span className="flex items-center gap-1">
                  <Banknote className="h-3 w-3 text-success" /> Cash {formatCurrency(summary.byMethod.cash)}
                </span>
              </p>
            </div>
          </Card>
          <StatsCard label="Total Expected" value={summary.totalExpected} format={formatCurrency} icon={Target} accent="violet" hint={`${summary.counts.total} members billed`} />
          <StatsCard label="Pending" value={summary.totalPending} format={formatCurrency} icon={Clock3} accent="warning" hint={`${summary.counts.pending} members`} onClick={() => setStatus('pending')} />
          <StatsCard
            label="Overdue"
            value={summary.totalOverdue}
            format={formatCurrency}
            icon={AlertCircle}
            accent="danger"
            hint={`${summary.counts.overdue} members · ${summary.counts.paid} paid`}
            onClick={() => setStatus('overdue')}
          />
        </motion.div>
      )}

      {/* Category breakdown */}
      {summary && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {MEMBERSHIP_CATEGORIES.map((c) => {
            const b = summary.byCategory[c.value];
            return (
              <button
                key={c.value}
                onClick={() => setCategory(category === c.value ? '' : c.value)}
                className={cn(
                  'glass flex items-center justify-between rounded-xl px-4 py-3 text-left transition hover:border-white/20',
                  category === c.value && 'border-primary/40 bg-primary/5',
                )}
              >
                <span className="flex items-center gap-2 text-sm">
                  {c.emoji} {c.label}
                  <span className="text-xs text-muted">({b.count})</span>
                </span>
                <span className="text-sm">
                  <span className="font-semibold">{formatCurrency(b.collected)}</span>
                  <span className="text-xs text-muted"> / {formatCurrency(b.expected)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="glass inline-flex rounded-xl p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value || 'all'}
              onClick={() => setStatus(t.value)}
              className={cn('relative rounded-lg px-4 py-2 text-sm font-medium transition', status === t.value ? 'text-ink-950' : 'text-muted hover:text-white')}
            >
              {status === t.value && <motion.span layoutId="status-tab" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <Input placeholder="Search member…" icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} placeholder="All categories" options={MEMBERSHIP_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="Any method"
            options={[
              { value: 'online', label: 'Online' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
        </div>
      </div>

      <div className="mt-4">
        {error ? (
          <EmptyState icon={CreditCard} title="Could not load payments" description={error.message} action={<Button onClick={refresh}>Retry</Button>} />
        ) : isLoading && !payments ? (
          <SkeletonTable />
        ) : (
          <Table
            columns={columns}
            data={payments ?? []}
            rowKey={(p) => p._id}
            initialSort={{ key: 'status', order: 'asc' }}
            empty={
              <EmptyState
                icon={CheckCircle2}
                title="No payments match"
                description={`No ${status || ''} payment records for ${monthLabel(period.month, period.year)} with these filters.`}
                action={
                  <Button variant="secondary" onClick={generateDues} loading={generating}>
                    Generate dues for this month
                  </Button>
                }
              />
            }
          />
        )}
      </div>

      <Modal open={cash.open} onClose={() => setCash({ open: false })} title="Mark cash payment" description="Record a payment received at the front desk.">
        <PaymentForm
          key={cash.memberId ?? 'any'}
          defaultMemberId={cash.memberId}
          defaultMonth={period.month}
          defaultYear={period.year}
          onCancel={() => setCash({ open: false })}
          onSuccess={() => {
            setCash({ open: false });
            refresh();
          }}
        />
      </Modal>
    </>
  );
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PaymentsContent />
    </Suspense>
  );
}
