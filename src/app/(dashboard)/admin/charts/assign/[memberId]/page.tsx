'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check, ClipboardList, Dumbbell, Eye, Plus, Search, Unlink, UserX } from 'lucide-react';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, staggerContainer, cardItem } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Loader, Skeleton } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SuccessBurst } from '@/components/ui/SuccessBurst';
import { CategoryBadge } from '@/components/dashboard/MemberTable';
import { ChartCategoryBadge, chartCategoryMeta } from '@/components/charts/WorkoutChartCard';
import { ChartViewer } from '@/components/charts/ChartViewer';
import { ChartForm } from '@/components/forms/ChartForm';
import { cn } from '@/lib/utils';
import type { UserDTO, WorkoutChartDTO } from '@/types';

export default function AssignChartPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<WorkoutChartDTO | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: member, error, isLoading, mutate: mutateMember } = useFetch<UserDTO>(`/api/members/${memberId}`);
  const { data: charts, mutate: mutateCharts } = useFetch<WorkoutChartDTO[]>('/api/charts');

  if (isLoading && !member) return <Loader label="Loading member…" />;
  if (error || !member) {
    return <EmptyState icon={UserX} title="Member not found" description={error?.message} action={<Button onClick={() => router.push('/admin/members')}>Back to members</Button>} />;
  }

  const currentId = typeof member.assignedChart === 'object' && member.assignedChart ? member.assignedChart._id : (member.assignedChart as string | null);
  const activeId = selected ?? currentId ?? null;
  const filtered = (charts ?? []).filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  async function assign(chartId: string | null) {
    setSaving(true);
    try {
      await apiRequest('/api/charts/assign', 'POST', { memberId, chartId });
      if (chartId) {
        setSuccess(true);
        window.setTimeout(() => setSuccess(false), 2200);
        toast.success(`Chart assigned to ${member!.name}`);
      } else {
        toast.success('Chart unassigned');
      }
      setSelected(null);
      setUnassignOpen(false);
      mutateMember();
      mutateCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not assign chart');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Assign Workout Chart"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Members', href: '/admin/members' },
          { label: member.name, href: `/admin/members/${member._id}` },
          { label: 'Assign chart' },
        ]}
        actions={
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            Create new chart
          </Button>
        }
      />

      <Card className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center" initial="hidden" animate="show">
        <div className="flex flex-1 items-center gap-4">
          <Avatar name={member.name} src={member.profileImage} size="lg" />
          <div>
            <p className="text-lg font-semibold">{member.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <CategoryBadge category={member.membershipCategory} />
              <span>Goal: {member.fitnessGoal}</span>
              <span>· {member.bodyType}</span>
            </div>
          </div>
        </div>
        <div className="text-sm sm:text-right">
          <p className="text-xs uppercase tracking-wider text-muted">Current chart</p>
          {typeof member.assignedChart === 'object' && member.assignedChart ? (
            <div className="mt-1 flex items-center gap-2 sm:justify-end">
              <span className="font-medium">{member.assignedChart.title}</span>
              <button onClick={() => setUnassignOpen(true)} className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger" title="Unassign" aria-label="Unassign chart">
                <Unlink className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="mt-1 text-muted">None assigned</p>
          )}
        </div>
      </Card>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input placeholder="Search charts…" icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} wrapperClassName="sm:w-72" />
        <Button
          size="lg"
          variant="success"
          loading={saving}
          disabled={!selected || selected === currentId}
          icon={<Check className="h-4 w-4" />}
          onClick={() => selected && assign(selected)}
        >
          {currentId ? 'Update assigned chart' : 'Assign selected chart'}
        </Button>
      </div>

      {!charts ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : charts.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No charts in the library" description="Create a chart first, then assign it." action={<Button onClick={() => setCreateOpen(true)}>Create chart</Button>} />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((chart) => {
            const isActive = activeId === chart._id;
            const isCurrent = currentId === chart._id;
            const meta = chartCategoryMeta(chart.category);
            return (
              <motion.div
                key={chart._id}
                variants={cardItem}
                whileHover={{ y: -4 }}
                onClick={() => setSelected(chart._id)}
                className={cn('glass relative cursor-pointer overflow-hidden rounded-2xl p-5 transition-colors', isActive ? 'border-primary/60 bg-primary/[0.06]' : 'hover:border-white/20')}
                style={isActive ? { boxShadow: '0 0 28px rgba(0,212,255,0.2)' } : undefined}
              >
                <div className="absolute inset-y-0 left-0 w-1" style={{ background: meta.color }} />
                <div className="flex items-start justify-between gap-3">
                  <ChartCategoryBadge category={chart.category} />
                  <span
                    className={cn('flex h-6 w-6 items-center justify-center rounded-full border-2 transition', isActive ? 'border-primary bg-primary text-ink-950' : 'border-white/20')}
                  >
                    {isActive && <Check className="h-3.5 w-3.5" />}
                  </span>
                </div>
                <p className="mt-3 font-semibold">{chart.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{chart.description || chart.exercises.map((e) => e.name).join(', ')}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <Dumbbell className="h-3.5 w-3.5" /> {chart.exercises.length} exercises
                  </span>
                  <div className="flex items-center gap-2">
                    {isCurrent && <span className="rounded-full bg-success/15 px-2 py-0.5 font-medium text-success">Current</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview(chart);
                      }}
                      className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white"
                      aria-label="Preview chart"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Success overlay */}
      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <SuccessBurst tone="primary" />
        </motion.div>
      )}

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} size="xl" title="Chart preview">
        {preview && (
          <>
            <ChartViewer chart={preview} compact />
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => {
                  setSelected(preview._id);
                  setPreview(null);
                }}
                icon={<Check className="h-4 w-4" />}
              >
                Select this chart
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} size="lg" title={`New chart for ${member.name}`}>
        <ChartForm
          onCancel={() => setCreateOpen(false)}
          onSuccess={async (chart) => {
            setCreateOpen(false);
            await mutateCharts();
            await assign(chart._id);
          }}
        />
      </Modal>

      <ConfirmModal
        open={unassignOpen}
        onClose={() => setUnassignOpen(false)}
        onConfirm={() => assign(null)}
        loading={saving}
        title="Unassign chart?"
        message={`${member.name} will no longer see this chart in their dashboard.`}
        confirmLabel="Unassign"
      />
    </>
  );
}
