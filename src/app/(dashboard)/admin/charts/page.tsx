'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ClipboardList, Pencil, Plus, Search, UserPlus } from 'lucide-react';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { staggerContainer } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkoutChartCard } from '@/components/charts/WorkoutChartCard';
import { ChartViewer } from '@/components/charts/ChartViewer';
import { ChartForm } from '@/components/forms/ChartForm';
import { CHART_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { MemberSummary, WorkoutChartDTO } from '@/types';

export default function ChartsPage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [form, setForm] = useState<{ open: boolean; chart?: WorkoutChartDTO | null }>({ open: false });
  const [viewing, setViewing] = useState<WorkoutChartDTO | null>(null);
  const [deleting, setDeleting] = useState<WorkoutChartDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (debounced) params.set('search', debounced);
  const { data: charts, isLoading, error, mutate } = useFetch<WorkoutChartDTO[]>(`/api/charts?${params.toString()}`);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiRequest(`/api/charts/${deleting._id}`, 'DELETE');
      toast.success('Chart deleted');
      setDeleting(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Workout Charts"
        description="Build workout programs and assign them to members."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Workout Charts' }]}
        actions={
          <>
            <Link href="/admin/members">
              <Button variant="secondary" icon={<UserPlus className="h-4 w-4" />}>
                Assign to member
              </Button>
            </Link>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, chart: null })}>
              New chart
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <Input placeholder="Search charts…" icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} wrapperClassName="lg:w-72" />
        <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ value: '', label: 'All', color: '#ffffff' }, ...CHART_CATEGORIES].map((c) => (
            <button
              key={c.value || 'all'}
              onClick={() => setCategory(c.value)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm transition',
                category === c.value ? 'border-transparent font-medium text-ink-950' : 'border-white/10 text-muted hover:border-white/25 hover:text-white',
              )}
              style={category === c.value ? { background: c.color } : undefined}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <EmptyState icon={ClipboardList} title="Could not load charts" description={error.message} action={<Button onClick={() => mutate()}>Retry</Button>} />
      ) : isLoading && !charts ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : charts && charts.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={category || debounced ? 'No charts match' : 'No workout charts yet'}
          description={category || debounced ? 'Try a different category or search.' : 'Create your first chart — chest day, leg day, full body… then assign it to members.'}
          action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, chart: null })}>Create chart</Button>}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {charts?.map((chart) => (
              <WorkoutChartCard
                key={chart._id}
                chart={chart}
                onOpen={() => setViewing(chart)}
                onEdit={() => setForm({ open: true, chart })}
                onDelete={() => setDeleting(chart)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal open={form.open} onClose={() => setForm({ open: false })} title={form.chart ? 'Edit workout chart' : 'New workout chart'} size="lg">
        <ChartForm
          key={form.chart?._id ?? 'new'}
          chart={form.chart}
          onCancel={() => setForm({ open: false })}
          onSuccess={() => {
            setForm({ open: false });
            mutate();
          }}
        />
      </Modal>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} size="xl" title="Chart preview">
        {viewing && (
          <div className="space-y-6">
            <ChartViewer chart={viewing} compact />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-3 text-sm font-semibold">Assigned to {viewing.assignedTo.length} member(s)</p>
              {viewing.assignedTo.length === 0 ? (
                <p className="text-sm text-muted">Not assigned yet. Open a member and choose “Assign chart”.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(viewing.assignedTo as MemberSummary[]).map((m) => (
                    <Link key={m._id} href={`/admin/members/${m._id}`} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-sm hover:border-primary/40">
                      <Avatar name={m.name} src={m.profileImage} size="xs" />
                      {m.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => {
                  setForm({ open: true, chart: viewing });
                  setViewing(null);
                }}
              >
                Edit chart
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Delete this chart?"
        message={
          <>
            “{deleting?.title}” will be removed{deleting && deleting.assignedTo.length > 0 ? ` and unassigned from ${deleting.assignedTo.length} member(s)` : ''}.
          </>
        }
        confirmLabel="Delete chart"
      />
    </>
  );
}
