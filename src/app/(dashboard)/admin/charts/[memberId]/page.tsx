'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, MessageCircle, Printer, Trash2, UserX } from 'lucide-react';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmModal } from '@/components/ui/Modal';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryBadge } from '@/components/dashboard/MemberTable';
import { WorkoutPlanForm } from '@/components/workout/WorkoutPlanForm';
import { PlanViewer } from '@/components/workout/PlanViewer';
import { formatPlanForWhatsApp, whatsappLink } from '@/lib/workoutPlan';
import { formatDate } from '@/lib/utils';
import type { UserDTO, WorkoutPlanDTO } from '@/types';

export default function MemberPlanEditorPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: member, error: memberError, isLoading: memberLoading } = useFetch<UserDTO>(`/api/members/${memberId}`);
  // `undefined` = loading, `null` = no plan yet
  const { data: plan, mutate, isLoading: planLoading } = useFetch<WorkoutPlanDTO | null>(`/api/workout-plans/${memberId}`, {
    revalidateOnFocus: false,
  });

  if ((memberLoading && !member) || (planLoading && plan === undefined)) return <Loader label="Loading workout plan…" />;
  if (memberError || !member) {
    return (
      <EmptyState
        icon={UserX}
        title="Member not found"
        description={memberError?.message}
        action={<Button onClick={() => router.push('/admin/charts')}>Back to workout plans</Button>}
      />
    );
  }

  const whatsappText = plan
    ? formatPlanForWhatsApp({ gymName: plan.gymName, planTitle: plan.planTitle, memberName: member.name, notes: plan.notes, days: plan.days })
    : '';

  async function copyText() {
    try {
      await navigator.clipboard.writeText(whatsappText);
      toast.success('Copied — paste it into WhatsApp');
    } catch {
      toast.error('Could not access the clipboard');
    }
  }

  async function deletePlan() {
    setDeleting(true);
    try {
      await apiRequest(`/api/workout-plans/${memberId}`, 'DELETE');
      toast.success('Workout plan deleted');
      setDeleteOpen(false);
      await mutate(null, { revalidate: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={plan ? 'Edit Workout Plan' : 'Create Workout Plan'}
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Workout Plans', href: '/admin/charts' },
            { label: member.name },
          ]}
          actions={
            plan ? (
              <>
                <Button variant="success" size="sm" icon={<MessageCircle className="h-4 w-4" />} onClick={() => window.open(whatsappLink(member.phone, whatsappText), '_blank', 'noopener')}>
                  Send on WhatsApp
                </Button>
                <Button variant="secondary" size="sm" icon={<Copy className="h-4 w-4" />} onClick={copyText}>
                  Copy text
                </Button>
                <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                  Print
                </Button>
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)} className="hover:text-danger">
                  Delete
                </Button>
              </>
            ) : undefined
          }
        />

        <div className="glass mb-6 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <Avatar name={member.name} src={member.profileImage} size="md" />
            <div className="min-w-0">
              <Link href={`/admin/members/${member._id}`} className="font-semibold hover:text-primary">
                {member.name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <CategoryBadge category={member.membershipCategory} />
                <span>Goal: {member.fitnessGoal}</span>
                <span>· {member.bodyType}</span>
                <span>
                  · {member.weight} kg / {member.height} cm
                </span>
              </div>
            </div>
          </div>
          {member.healthConditions && (
            <p className="rounded-xl border border-warning/25 bg-warning/[0.06] px-3 py-2 text-xs text-warning sm:max-w-xs">⚠️ {member.healthConditions}</p>
          )}
          {plan && typeof plan.updatedBy === 'object' && plan.updatedBy && (
            <p className="text-xs text-muted sm:text-right">
              Last updated {formatDate(plan.updatedAt)}
              <br />
              by {plan.updatedBy.name}
            </p>
          )}
        </div>

        <WorkoutPlanForm
          key={plan?._id ?? 'new'}
          memberId={member._id}
          memberName={member.name}
          memberGoal={member.fitnessGoal}
          plan={plan ?? null}
          onSaved={(saved) => mutate(saved, { revalidate: false })}
        />
      </div>

      {/* Printable version of the saved plan */}
      {plan && (
        <div className="hidden print:block">
          <PlanViewer plan={{ ...plan, memberName: member.name }} />
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deletePlan}
        loading={deleting}
        title="Delete this workout plan?"
        message={`${member.name} will no longer see a routine in their dashboard. You can create a new one any time.`}
        confirmLabel="Delete plan"
      />
    </>
  );
}
