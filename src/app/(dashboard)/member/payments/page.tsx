'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AlertTriangle, Banknote, CheckCircle2, CreditCard, Globe, Lock, Receipt, ShieldCheck } from 'lucide-react';
import { apiRequest, fetcher, useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, type Column } from '@/components/ui/Table';
import { Loader, Skeleton, SkeletonTable } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SuccessBurst } from '@/components/ui/SuccessBurst';
import { PaymentStatusBadge } from '@/components/dashboard/PaymentStatusBadge';
import { categoryLabel, currentMonthYear, formatCurrency, formatDate, monthLabel } from '@/lib/utils';
import { GYM } from '@/lib/constants';
import type { MemberStats, PaymentDTO } from '@/types';

function PaymentsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: payments, isLoading, mutate } = useFetch<PaymentDTO[]>('/api/payments');
  const { data: stats, mutate: mutateStats } = useFetch<MemberStats>('/api/dashboard/stats');
  const [paying, setPaying] = useState<string | null>(null);
  const [success, setSuccess] = useState<PaymentDTO | null>(null);
  const [verifying, setVerifying] = useState(false);
  const handled = useRef(false);

  // Handle return from Stripe Checkout
  useEffect(() => {
    if (handled.current) return;
    const status = params.get('status');
    const sessionId = params.get('session_id');
    if (!status) return;
    handled.current = true;

    if (status === 'cancelled') {
      toast('Payment cancelled — you can try again any time.', { icon: '↩️' });
      router.replace('/member/payments');
      return;
    }
    if (status === 'success' && sessionId) {
      setVerifying(true);
      fetcher<{ paid: boolean; payment: PaymentDTO }>(`/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => {
          if (res?.paid) setSuccess(res.payment);
          else toast('Payment is processing — status will update shortly.', { icon: '⏳' });
        })
        .catch(() => toast.error('Could not verify payment yet. It will update automatically.'))
        .finally(() => {
          setVerifying(false);
          mutate();
          mutateStats();
          router.replace('/member/payments');
        });
    }
  }, [params, router, mutate, mutateStats]);

  async function payNow(paymentId: string) {
    setPaying(paymentId);
    try {
      const { url } = await apiRequest<{ url: string }>('/api/payments', 'POST', { paymentId });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout');
      setPaying(null);
    }
  }

  const { month, year } = currentMonthYear();
  const current = payments?.find((p) => p.month === month && p.year === year) ?? null;
  const overdue = (payments ?? []).filter((p) => p.paymentStatus === 'overdue');
  const totalPaid = (payments ?? []).filter((p) => p.paymentStatus === 'paid').reduce((s, p) => s + p.amount, 0);
  const isPaid = current?.paymentStatus === 'paid';

  const columns: Column<PaymentDTO>[] = [
    { key: 'month', header: 'Month', primary: true, sortValue: (p) => p.year * 100 + p.month, render: (p) => <span className="font-medium">{monthLabel(p.month, p.year)}</span> },
    { key: 'amount', header: 'Amount', sortValue: (p) => p.amount, render: (p) => formatCurrency(p.amount) },
    {
      key: 'method',
      header: 'Method',
      render: (p) =>
        p.paymentMethod ? (
          <span className="inline-flex items-center gap-1.5 capitalize text-muted">
            {p.paymentMethod === 'online' ? <Globe className="h-3.5 w-3.5 text-primary" /> : <Banknote className="h-3.5 w-3.5 text-success" />}
            {p.paymentMethod}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'status', header: 'Status', render: (p) => <PaymentStatusBadge status={p.paymentStatus} /> },
    { key: 'date', header: 'Date', sortValue: (p) => p.paidAt, render: (p) => <span className="text-muted">{formatDate(p.paidAt)}</span> },
    {
      key: 'action',
      header: '',
      render: (p) =>
        p.paymentStatus !== 'paid' ? (
          <Button size="sm" variant="outline" loading={paying === p._id} onClick={() => payNow(p._id)}>
            Pay
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Payments" description="Your membership fees and payment history." breadcrumbs={[{ label: 'Dashboard', href: '/member' }, { label: 'Payments' }]} />

      {verifying && (
        <Card className="mb-6 flex items-center gap-3" initial="hidden" animate="show">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
          <p className="text-sm">Confirming your payment with Stripe…</p>
        </Card>
      )}

      {isLoading && !payments ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-3">
          {/* Current month status */}
          <Card
            padding="lg"
            className={`overflow-hidden lg:col-span-2 ${isPaid ? 'border-success/30' : 'border-warning/30'}`}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: isPaid
                  ? 'radial-gradient(circle at 85% 20%, rgba(0,255,136,0.18), transparent 55%)'
                  : 'radial-gradient(circle at 85% 20%, rgba(255,170,0,0.18), transparent 55%)',
              }}
            />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">{monthLabel(month, year)}</p>
                <motion.h2
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                  className={`mt-2 font-display text-4xl font-extrabold sm:text-5xl ${isPaid ? 'text-success' : 'text-warning'}`}
                >
                  {isPaid ? 'PAID ✅' : current ? 'PAYMENT DUE ⚠️' : 'NO DUES'}
                </motion.h2>
                <p className="mt-3 text-sm text-muted">
                  {stats && <>{categoryLabel(stats.membershipCategory)} · </>}
                  <span className="font-semibold text-white">{formatCurrency(current?.amount ?? stats?.monthlyFee ?? 0)}</span> / month
                </p>
                {isPaid && current && (
                  <p className="mt-1 text-xs text-muted">
                    Paid {current.paymentMethod === 'cash' ? 'in cash at the front desk' : 'online'} on {formatDate(current.paidAt)}
                  </p>
                )}
              </div>
              {!isPaid && current && (
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <Button size="lg" glow loading={paying === current._id} onClick={() => payNow(current._id)} icon={<CreditCard className="h-5 w-5" />}>
                    Pay Now · {formatCurrency(current.amount)}
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted sm:justify-end">
                    <Lock className="h-3 w-3" /> Secure checkout by Stripe
                  </p>
                </div>
              )}
              {isPaid && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="hidden sm:block">
                  <CheckCircle2 className="h-24 w-24 text-success/80" />
                </motion.div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Summary" icon={<Receipt />} />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                <dt className="text-muted">Total paid</dt>
                <dd className="font-semibold text-success">{formatCurrency(totalPaid)}</dd>
              </div>
              <div className="flex justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                <dt className="text-muted">Months paid</dt>
                <dd className="font-semibold">{(payments ?? []).filter((p) => p.paymentStatus === 'paid').length}</dd>
              </div>
              <div className="flex justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                <dt className="text-muted">Overdue</dt>
                <dd className={`font-semibold ${overdue.length ? 'text-danger' : ''}`}>{overdue.length}</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Prefer cash? Pay at the front desk — an admin will mark it as paid.
            </p>
          </Card>

          {overdue.length > 0 && (
            <Card className="border-danger/30 bg-danger/[0.05] lg:col-span-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <AlertTriangle className="h-6 w-6 shrink-0 text-danger" />
                <div className="flex-1">
                  <p className="font-semibold">You have {overdue.length} overdue payment{overdue.length > 1 ? 's' : ''}</p>
                  <p className="text-sm text-muted">{overdue.map((p) => monthLabel(p.month, p.year)).join(', ')}</p>
                </div>
                <Button variant="danger" loading={paying === overdue[0]._id} onClick={() => payNow(overdue[0]._id)}>
                  Pay {monthLabel(overdue[0].month, overdue[0].year)}
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Payment History</h2>
        {isLoading && !payments ? (
          <SkeletonTable rows={4} />
        ) : (
          <Table
            columns={columns}
            data={payments ?? []}
            rowKey={(p) => p._id}
            initialSort={{ key: 'month', order: 'desc' }}
            empty={<EmptyState icon={Receipt} title="No payments yet" description="Your monthly payment records will appear here." />}
          />
        )}
      </div>

      <Modal open={Boolean(success)} onClose={() => setSuccess(null)} size="sm">
        <div className="flex flex-col items-center pb-2 text-center">
          <SuccessBurst size={84} />
          <h3 className="text-xl font-bold">Payment successful!</h3>
          {success && (
            <p className="mt-2 text-sm text-muted">
              {formatCurrency(success.amount)} for {monthLabel(success.month, success.year)} has been received. Thank you for training with {GYM.shortName}!
            </p>
          )}
          <Button className="mt-6" onClick={() => setSuccess(null)}>
            Awesome
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function MemberPaymentsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PaymentsContent />
    </Suspense>
  );
}
