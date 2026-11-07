'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Activity,
  Banknote,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Flame,
  HeartPulse,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  Ruler,
  Scale,
  Target,
  Trash2,
  UserRound,
  UserX,
} from 'lucide-react';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { Table, type Column } from '@/components/ui/Table';
import { AttendanceCalendar } from '@/components/dashboard/AttendanceCalendar';
import { PaymentStatusBadge } from '@/components/dashboard/PaymentStatusBadge';
import { CategoryBadge } from '@/components/dashboard/MemberTable';
import { WeightChart } from '@/components/dashboard/WeightChart';
import { dayColor } from '@/components/workout/PlanViewer';
import { MemberEditForm } from '@/components/forms/MemberEditForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { bmi, currentMonthYear, formatCurrency, formatDate, formatTime, monthLabel } from '@/lib/utils';
import type { MemberAttendance, PaymentDTO, UserDTO, WorkoutPlanDTO } from '@/types';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [period, setPeriod] = useState(currentMonthYear());
  const [editOpen, setEditOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [confirm, setConfirm] = useState<'deactivate' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: member, error, isLoading, mutate } = useFetch<UserDTO>(`/api/members/${id}`);
  const { data: payments, mutate: mutatePayments } = useFetch<PaymentDTO[]>(`/api/payments?memberId=${id}`);
  const { data: plan } = useFetch<WorkoutPlanDTO | null>(`/api/workout-plans/${id}`);
  const { data: attendance, mutate: mutateAttendance } = useFetch<MemberAttendance>(
    `/api/attendance/member/${id}?month=${period.month}&year=${period.year}`,
  );

  if (isLoading && !member) return <Loader label="Loading member…" />;
  if (error || !member) {
    return (
      <EmptyState
        icon={UserX}
        title="Member not found"
        description={error?.message ?? 'This member may have been removed.'}
        action={<Button onClick={() => router.push('/admin/members')}>Back to members</Button>}
      />
    );
  }

  const memberBmi = bmi(member.weight, member.height);
  const paidTotal = (payments ?? []).filter((p) => p.paymentStatus === 'paid').reduce((s, p) => s + p.amount, 0);

  async function toggleActive() {
    setBusy(true);
    try {
      await apiRequest(`/api/members/${id}`, 'PUT', { isActive: !member!.isActive });
      toast.success(member!.isActive ? 'Member deactivated' : 'Member reactivated');
      setConfirm(null);
      mutate();
      mutatePayments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function deleteMember() {
    setBusy(true);
    try {
      await apiRequest(`/api/members/${id}`, 'DELETE');
      toast.success('Member deleted permanently');
      router.replace('/admin/members');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  }

  async function checkIn() {
    try {
      await apiRequest('/api/attendance', 'POST', { memberId: id });
      toast.success(`${member!.name} checked in`);
      mutateAttendance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed');
    }
  }

  const paymentColumns: Column<PaymentDTO>[] = [
    { key: 'month', header: 'Month', primary: true, sortValue: (p) => p.year * 100 + p.month, render: (p) => <span className="font-medium">{monthLabel(p.month, p.year)}</span> },
    { key: 'amount', header: 'Amount', sortValue: (p) => p.amount, render: (p) => formatCurrency(p.amount) },
    { key: 'method', header: 'Method', render: (p) => <span className="capitalize text-muted">{p.paymentMethod ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (p) => <PaymentStatusBadge status={p.paymentStatus} /> },
    {
      key: 'paidAt',
      header: 'Paid on',
      sortValue: (p) => p.paidAt,
      render: (p) => (
        <span className="text-muted">
          {formatDate(p.paidAt)}
          {p.paymentMethod === 'cash' && typeof p.markedBy === 'object' && p.markedBy && <span className="block text-[11px]">by {p.markedBy.name}</span>}
        </span>
      ),
    },
  ];

  const details = [
    { icon: Mail, label: 'Email', value: member.email },
    { icon: Phone, label: 'Phone', value: member.phone },
    { icon: MapPin, label: 'Address', value: member.address },
    { icon: UserRound, label: 'Age / Gender', value: `${member.age} · ${member.gender}` },
  ];
  const body = [
    { icon: Scale, label: 'Weight', value: `${member.weight} kg` },
    { icon: Ruler, label: 'Height', value: `${member.height} cm` },
    { icon: Activity, label: 'BMI', value: memberBmi ? `${memberBmi.value} · ${memberBmi.label}` : '—' },
    { icon: UserRound, label: 'Body type', value: member.bodyType },
    { icon: Target, label: 'Goal', value: member.fitnessGoal },
  ];

  return (
    <>
      <PageHeader
        title={member.name}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Members', href: '/admin/members' }, { label: member.name }]}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<CalendarCheck className="h-4 w-4" />} onClick={checkIn} disabled={!member.isActive}>
              Check in
            </Button>
            <Button variant="secondary" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Link href={`/admin/charts/${member._id}`}>
              <Button variant="secondary" size="sm" icon={<ClipboardList className="h-4 w-4" />}>
                Workout plan
              </Button>
            </Link>
            <Button size="sm" variant="success" icon={<Banknote className="h-4 w-4" />} onClick={() => setCashOpen(true)}>
              Mark cash payment
            </Button>
          </>
        }
      />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-3">
        {/* Profile column */}
        <div className="space-y-6">
          <Card className="overflow-hidden text-center">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary/25 via-violet/20 to-transparent" />
            <div className="relative pt-4">
              <Avatar name={member.name} src={member.profileImage} size="xl" ring className="mx-auto" />
              <h2 className="mt-4 text-xl font-semibold">{member.name}</h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <CategoryBadge category={member.membershipCategory} />
                <Badge tone={member.isActive ? 'success' : 'neutral'} dot pulse={member.isActive}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted">Member since {formatDate(member.registeredDate)}</p>
              <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] py-3">
                <div>
                  <p className="font-display text-lg font-bold">{attendance?.totalAllTime ?? '—'}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">Visits</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 font-display text-lg font-bold">
                    {attendance?.streak ?? 0}
                    <Flame className="h-4 w-4 text-warning" />
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">Streak</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold">{formatCurrency(paidTotal).replace('Rs. ', '')}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">Paid (Rs)</p>
                </div>
              </div>
            </div>
            <ul className="relative mt-5 space-y-3 text-left text-sm">
              {details.map((d) => (
                <li key={d.label} className="flex items-start gap-3">
                  <d.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted">{d.label}</p>
                    <p className="break-words">{d.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Body Details" icon={<HeartPulse />} />
            <dl className="grid grid-cols-2 gap-3">
              {body.map((b) => (
                <div key={b.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
                    <b.icon className="h-3 w-3" />
                    {b.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{b.value}</dd>
                </div>
              ))}
            </dl>
            {member.healthConditions && (
              <div className="mt-3 rounded-xl border border-warning/20 bg-warning/5 p-3 text-sm">
                <p className="text-[10px] uppercase tracking-wider text-warning">Health conditions</p>
                <p className="mt-1">{member.healthConditions}</p>
              </div>
            )}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted">Weight trend</p>
              <WeightChart history={member.weightHistory ?? []} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Danger Zone" icon={<Power />} />
            <div className="space-y-2">
              <Button variant="secondary" fullWidth icon={<Power className="h-4 w-4" />} onClick={() => (member.isActive ? setConfirm('deactivate') : toggleActive())} loading={busy && confirm === null}>
                {member.isActive ? 'Deactivate membership' : 'Reactivate membership'}
              </Button>
              <Button variant="danger" fullWidth icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirm('delete')}>
                Delete member
              </Button>
            </div>
          </Card>
        </div>

        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Workout Plan"
              description={plan ? `${plan.days.length} days · updated ${formatDate(plan.updatedAt)}` : 'Personal day-by-day routine'}
              icon={<ClipboardList />}
              action={
                <Link href={`/admin/charts/${member._id}`} className="text-xs text-primary hover:underline">
                  {plan ? 'Edit plan' : 'Create plan'}
                </Link>
              }
            />
            {plan === undefined ? (
              <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
            ) : plan ? (
              <div>
                <p className="font-semibold">{plan.planTitle}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {plan.days.map((d, i) => (
                    <div key={d._id ?? i} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-xs font-bold" style={{ color: dayColor(i) }}>
                        DAY {d.dayNumber}
                        {d.dayTitle && <span className="ml-1.5 font-semibold text-white">{d.dayTitle}</span>}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{d.exercises.map((e) => e.name).join(' · ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-8 text-center">
                <p className="text-sm text-muted">No workout plan yet.</p>
                <Link href={`/admin/charts/${member._id}`}>
                  <Button size="sm" icon={<ClipboardList className="h-4 w-4" />}>
                    Create plan
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Attendance"
              description={`${attendance?.totalInPeriod ?? 0} visits this month · longest streak ${attendance?.longestStreak ?? 0} days`}
              icon={<CalendarCheck />}
              action={<MonthPicker month={period.month} year={period.year} onChange={setPeriod} />}
            />
            <AttendanceCalendar
              month={period.month}
              year={period.year}
              attended={(attendance?.records ?? []).map((r) => ({ date: r.date, checkInTime: r.checkInTime }))}
            />
            {attendance && attendance.records.length > 0 && (
              <p className="mt-3 text-xs text-muted">Last check-in: {formatDate(attendance.records[0].checkInTime)} at {formatTime(attendance.records[0].checkInTime)}</p>
            )}
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="p-5 pb-0 sm:p-6 sm:pb-0">
              <CardHeader title="Payment History" description="All months" icon={<CreditCard />} />
            </div>
            <div className="px-3 pb-3 sm:px-4 sm:pb-4">
              {payments === undefined ? (
                <Loader label="Loading payments…" />
              ) : (
                <Table
                  columns={paymentColumns}
                  data={payments}
                  rowKey={(p) => p._id}
                  initialSort={{ key: 'month', order: 'desc' }}
                  empty={<p className="py-8 text-center text-sm text-muted">No payments recorded.</p>}
                />
              )}
            </div>
          </Card>
        </div>
      </motion.div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${member.name}`} size="lg">
        <MemberEditForm
          member={member}
          onCancel={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            mutate();
            mutatePayments();
          }}
        />
      </Modal>

      <Modal open={cashOpen} onClose={() => setCashOpen(false)} title="Mark cash payment" description={`Record a cash payment from ${member.name}.`}>
        <PaymentForm
          defaultMemberId={member._id}
          onCancel={() => setCashOpen(false)}
          onSuccess={() => {
            setCashOpen(false);
            mutatePayments();
          }}
        />
      </Modal>

      <ConfirmModal
        open={confirm === 'deactivate'}
        onClose={() => setConfirm(null)}
        onConfirm={toggleActive}
        loading={busy}
        title="Deactivate membership?"
        message={`${member.name} won't be able to sign in or check in, and no new monthly dues will be generated. You can reactivate any time.`}
        confirmLabel="Deactivate"
      />
      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={deleteMember}
        loading={busy}
        title="Delete member permanently?"
        message={
          <>
            This removes <strong className="text-white">{member.name}</strong> along with all payment and attendance records. This
            cannot be undone.
          </>
        }
        confirmLabel="Delete forever"
      />
    </>
  );
}
