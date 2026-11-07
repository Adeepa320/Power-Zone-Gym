'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm, type Control, type FieldErrors, type UseFormRegister, type UseFormSetFocus } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  CopyPlus,
  Eye,
  MessageCircle,
  PencilLine,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { z } from 'zod';
import { workoutPlanSchema } from '@/lib/validations';
import { COMMON_EXERCISES, DAY_TITLE_SUGGESTIONS, GYM } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { apiRequest, fetcher, useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { MemberPlanListItem, PlanDay, WorkoutPlanDTO } from '@/types';
import { PlanViewer, dayColor } from './PlanViewer';
import { ImportWhatsAppModal } from './ImportWhatsAppModal';

export interface PlanFormValues {
  gymName: string;
  planTitle: string;
  startDate: string;
  notes: string;
  days: { dayNumber: number; dayTitle: string; exercises: { name: string; setsReps: string; notes: string }[] }[];
}

/**
 * Form-level schema: validates rows where they sit on screen (so errors land on the
 * right row). Completely blank rows are allowed here and stripped before saving.
 */
const planFormSchema = workoutPlanSchema.extend({
  startDate: z.string().min(1, 'Pick a start date'),
  days: z
    .array(
      z.object({
        dayNumber: z.coerce.number(),
        dayTitle: z.string().trim().max(80),
        exercises: z
          .array(
            z
              .object({ name: z.string().trim().max(120), setsReps: z.string().trim().max(60, 'Too long'), notes: z.string().trim().max(200) })
              .superRefine((e, ctx) => {
                if (!e.name && (e.setsReps || e.notes)) ctx.addIssue({ code: 'custom', path: ['name'], message: 'Exercise name is required' });
              }),
          )
          .refine((rows) => rows.some((r) => r.name.trim()), 'Add at least one exercise to this day'),
      }),
    )
    .min(1, 'Add at least one day')
    .max(14, 'Maximum 14 days'),
});

const emptyExercise = () => ({ name: '', setsReps: '', notes: '' });
const emptyDay = (n: number) => ({ dayNumber: n, dayTitle: '', exercises: [emptyExercise(), emptyExercise(), emptyExercise()] });

function toFormDays(days: PlanDay[]): PlanFormValues['days'] {
  return days.map((d, i) => ({
    dayNumber: i + 1,
    dayTitle: d.dayTitle ?? '',
    exercises: d.exercises.map((e) => ({ name: e.name, setsReps: e.setsReps ?? '', notes: e.notes ?? '' })),
  }));
}

/** Drop completely blank exercise rows before validation/saving. */
function compact(values: PlanFormValues): PlanFormValues {
  return {
    ...values,
    days: values.days.map((d, i) => ({
      ...d,
      dayNumber: i + 1,
      exercises: d.exercises.filter((e) => e.name.trim() || e.setsReps.trim() || e.notes.trim()),
    })),
  };
}

/** Full editor for a member's personalised multi-day workout plan. */
export function WorkoutPlanForm({
  memberId,
  memberName,
  memberGoal,
  plan,
  onSaved,
}: {
  memberId: string;
  memberName: string;
  memberGoal?: string;
  plan: WorkoutPlanDTO | null;
  onSaved: (plan: WorkoutPlanDTO) => void;
}) {
  const [importOpen, setImportOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  const defaults: PlanFormValues = plan
    ? {
        gymName: plan.gymName,
        planTitle: plan.planTitle,
        startDate: format(new Date(plan.startDate), 'yyyy-MM-dd'),
        notes: plan.notes ?? '',
        days: toFormDays(plan.days),
      }
    : {
        gymName: GYM.name,
        planTitle: memberGoal ? `${memberGoal} Program` : 'Personal Training Program',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        days: [emptyDay(1)],
      };

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setFocus,
    getValues,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: defaults,
  });

  const days = useFieldArray({ control, name: 'days' });
  const values = watch();

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  async function onSubmit() {
    const payload = compact(getValues());
    try {
      const saved = await apiRequest<WorkoutPlanDTO>(`/api/workout-plans/${memberId}`, 'PUT', payload);
      toast.success(plan ? `${memberName}'s plan updated — they see it now` : `Plan created for ${memberName}`);
      reset({ ...payload, days: toFormDays(saved.days) });
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save plan');
    }
  }

  function onInvalid(errs: FieldErrors<PlanFormValues>) {
    const msg = errs.days?.message ?? errs.days?.root?.message ?? 'Please fix the highlighted fields';
    toast.error(msg);
  }

  function importDays(imported: PlanDay[], mode: 'replace' | 'append') {
    const formDays = toFormDays(imported);
    if (mode === 'replace') days.replace(formDays);
    else days.append(formDays.map((d, i) => ({ ...d, dayNumber: days.fields.length + i + 1 })));
    toast.success(`Imported ${imported.length} day${imported.length === 1 ? '' : 's'}`);
  }

  function duplicateDay(index: number) {
    const source = getValues(`days.${index}`);
    days.insert(index + 1, { ...source, dayTitle: source.dayTitle ? `${source.dayTitle} (copy)` : '', exercises: source.exercises.map((e) => ({ ...e })) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      {/* Shared datalists for autocomplete */}
      <datalist id="exercise-suggestions">
        {COMMON_EXERCISES.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>
      <datalist id="day-title-suggestions">
        {DAY_TITLE_SUGGESTIONS.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>

      {/* Mobile: edit / preview switch */}
      <div className="glass mb-4 grid grid-cols-2 rounded-xl p-1 xl:hidden">
        {(
          [
            ['edit', 'Edit', PencilLine],
            ['preview', 'Preview', Eye],
          ] as const
        ).map(([tab, label, Icon]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={cn('flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition', mobileTab === tab ? 'bg-primary text-ink-950' : 'text-muted')}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* ---------------- Editor ---------------- */}
        <div className={cn('space-y-5', mobileTab === 'preview' && 'hidden xl:block')}>
          <div className="glass rounded-2xl p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Plan title" required placeholder="Weight Loss & Muscle Tone Schedule" error={errors.planTitle?.message} wrapperClassName="sm:col-span-2" {...register('planTitle')} />
              <Input label="Gym name" required error={errors.gymName?.message} {...register('gymName')} />
              <Input label="Start date" type="date" required error={errors.startDate?.message} {...register('startDate')} />
              <Textarea
                label="Trainer notes"
                rows={2}
                placeholder="e.g. Rest 60s between sets · Drink 3L water daily · Warm up 10 min on treadmill"
                wrapperClassName="sm:col-span-2"
                error={errors.notes?.message}
                {...register('notes')}
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="success" size="sm" icon={<MessageCircle className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
              Import from WhatsApp
            </Button>
            <Button variant="secondary" size="sm" icon={<Users className="h-4 w-4" />} onClick={() => setCopyOpen(true)}>
              Copy from another member
            </Button>
            <span className="ml-auto text-xs text-muted">
              {values.days?.length ?? 0} days · {values.days?.reduce((n, d) => n + d.exercises.filter((e) => e.name.trim()).length, 0) ?? 0} exercises
            </span>
          </div>
          {(errors.days?.message || errors.days?.root?.message) && <p className="text-sm text-danger">{errors.days?.message ?? errors.days?.root?.message}</p>}

          {/* Days */}
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {days.fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <DayEditor
                    index={index}
                    total={days.fields.length}
                    control={control}
                    register={register}
                    setFocus={setFocus}
                    errors={errors}
                    title={values.days?.[index]?.dayTitle ?? ''}
                    exerciseCount={values.days?.[index]?.exercises.filter((e) => e.name.trim()).length ?? 0}
                    onMoveUp={() => days.move(index, index - 1)}
                    onMoveDown={() => days.move(index, index + 1)}
                    onDuplicate={() => duplicateDay(index)}
                    onRemove={() => days.remove(index)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            type="button"
            disabled={days.fields.length >= 14}
            onClick={() => days.append(emptyDay(days.fields.length + 1), { focusName: `days.${days.fields.length}.dayTitle` })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 py-5 text-sm font-medium text-muted transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add Day {days.fields.length + 1}
          </button>
        </div>

        {/* ---------------- Live preview ---------------- */}
        <div className={cn(mobileTab === 'edit' && 'hidden xl:block')}>
          <div className="xl:sticky xl:top-24">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
              <Eye className="h-3.5 w-3.5" /> What {memberName.split(' ')[0]} will see
            </p>
            <div className="scrollbar-thin xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto xl:pr-1">
              <PlanViewer
                compact
                plan={{
                  gymName: values.gymName,
                  planTitle: values.planTitle,
                  startDate: values.startDate,
                  notes: values.notes,
                  memberName,
                  days: compact(values as PlanFormValues).days.filter((d) => d.exercises.length > 0),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20 mt-6">
        <div className="glass-strong flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <p className="flex items-center gap-2 text-sm">
            <span className={cn('h-2 w-2 rounded-full', isDirty ? 'animate-pulse bg-warning' : 'bg-success')} />
            <span className="text-muted">{isDirty ? 'Unsaved changes' : plan ? 'All changes saved' : 'New plan — not saved yet'}</span>
          </p>
          <div className="flex gap-2">
            {isDirty && (
              <Button variant="ghost" size="sm" onClick={() => reset(defaults)} disabled={isSubmitting}>
                Discard
              </Button>
            )}
            <Button type="submit" loading={isSubmitting} disabled={!isDirty && Boolean(plan)} icon={<Save className="h-4 w-4" />}>
              {plan ? 'Save plan' : 'Create plan'}
            </Button>
          </div>
        </div>
      </div>

      <ImportWhatsAppModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        hasExistingDays={(values.days ?? []).some((d) => d.exercises.some((e) => e.name.trim()))}
        onImport={importDays}
      />

      <CopyFromMemberModal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        excludeMemberId={memberId}
        onCopy={(source, includeDetails) => {
          days.replace(toFormDays(source.days));
          if (includeDetails) {
            setValue('planTitle', source.planTitle, { shouldDirty: true });
            setValue('notes', source.notes ?? '', { shouldDirty: true });
          }
          toast.success(`Copied ${source.days.length} days — adjust it for ${memberName.split(' ')[0]}`);
        }}
      />
    </form>
  );
}

/* ------------------------------------------------------------------ */

function DayEditor({
  index,
  total,
  control,
  register,
  setFocus,
  errors,
  title,
  exerciseCount,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  index: number;
  total: number;
  control: Control<PlanFormValues>;
  register: UseFormRegister<PlanFormValues>;
  setFocus: UseFormSetFocus<PlanFormValues>;
  errors: FieldErrors<PlanFormValues>;
  title: string;
  exerciseCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const exercises = useFieldArray({ control, name: `days.${index}.exercises` });
  const dayErrors = errors.days?.[index];
  const hasError = Boolean(dayErrors);
  const expanded = open || hasError;
  const color = dayColor(index);

  /** Enter in the last field of a row → jump to the next row (adding one if needed). */
  function nextRow(row: number) {
    if (row === exercises.fields.length - 1) {
      exercises.append(emptyExercise(), { focusName: `days.${index}.exercises.${row + 1}.name` });
    } else {
      setFocus(`days.${index}.exercises.${row + 1}.name`);
    }
  }

  return (
    <div className={cn('glass relative overflow-hidden rounded-2xl', hasError && 'border-danger/40')}>
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      {/* Day header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2" aria-label={expanded ? 'Collapse day' : 'Expand day'}>
          <motion.span animate={{ rotate: expanded ? 0 : -90 }}>
            <ChevronDown className="h-4 w-4 text-muted" />
          </motion.span>
          <span className="rounded-lg px-2.5 py-1 text-xs font-bold text-ink-950" style={{ background: color }}>
            DAY {index + 1}
          </span>
        </button>
        <input
          {...register(`days.${index}.dayTitle`)}
          list="day-title-suggestions"
          placeholder="Day title, e.g. Chest & Biceps"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold placeholder:font-normal placeholder:text-muted/60 focus:outline-none"
        />
        {!expanded && <span className="hidden text-xs text-muted sm:inline">{exerciseCount} exercises</span>}
        <div className="flex shrink-0 items-center">
          <IconBtn label="Move day up" disabled={index === 0} onClick={onMoveUp}>
            <ArrowUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Move day down" disabled={index === total - 1} onClick={onMoveDown}>
            <ArrowDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Duplicate day" disabled={total >= 14} onClick={onDuplicate}>
            <CopyPlus className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Remove day" disabled={total === 1} onClick={onRemove} danger>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="space-y-2 p-4">
              {/* Column labels (desktop) */}
              <div className="hidden grid-cols-[24px_minmax(0,1fr)_130px_minmax(0,0.7fr)_64px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted sm:grid">
                <span />
                <span>Exercise</span>
                <span>Sets / Reps</span>
                <span>Notes</span>
                <span />
              </div>
              {exercises.fields.map((field, row) => {
                const exErr = dayErrors?.exercises?.[row];
                return (
                  <div key={field.id} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[24px_minmax(0,1fr)_130px_minmax(0,0.7fr)_64px]">
                    <span className="pt-2.5 text-center font-mono text-xs" style={{ color }}>
                      {row + 1}
                    </span>
                    <div>
                      <input
                        {...register(`days.${index}.exercises.${row}.name`)}
                        list="exercise-suggestions"
                        placeholder="Exercise name"
                        className={cn(rowInput, exErr?.name && 'border-danger/60')}
                      />
                      {exErr?.name && <p className="mt-1 text-[11px] text-danger">{exErr.name.message}</p>}
                    </div>
                    <div className="flex sm:hidden">
                      <IconBtn label="Remove exercise" disabled={exercises.fields.length === 1} onClick={() => exercises.remove(row)} danger>
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                    <input
                      {...register(`days.${index}.exercises.${row}.setsReps`)}
                      placeholder="12 10 8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          nextRow(row);
                        }
                      }}
                      className={cn(rowInput, 'col-start-2 font-mono sm:col-start-auto')}
                    />
                    <input
                      {...register(`days.${index}.exercises.${row}.notes`)}
                      placeholder="Machine, slow negatives…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          nextRow(row);
                        }
                      }}
                      className={cn(rowInput, 'col-start-2 sm:col-start-auto')}
                    />
                    <div className="hidden sm:flex">
                      <IconBtn label="Move exercise up" disabled={row === 0} onClick={() => exercises.move(row, row - 1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn label="Remove exercise" disabled={exercises.fields.length === 1} onClick={() => exercises.remove(row)} danger>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                );
              })}
              {(dayErrors?.exercises?.message || dayErrors?.exercises?.root?.message) && (
                <p className="text-xs text-danger">{dayErrors.exercises.message ?? dayErrors.exercises.root?.message}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => exercises.append(emptyExercise(), { focusName: `days.${index}.exercises.${exercises.fields.length}.name` })}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-primary transition hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" /> Add exercise
                </button>
                <span className="hidden text-[11px] text-muted/70 sm:block">Press Enter in Sets / Notes to jump to the next row</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const rowInput =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm placeholder:text-muted/50 transition focus:border-primary/60 focus:bg-white/[0.06] focus:outline-none';

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'rounded-lg p-2 text-muted transition disabled:pointer-events-none disabled:opacity-25',
        danger ? 'hover:bg-danger/10 hover:text-danger' : 'hover:bg-white/10 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */

function CopyFromMemberModal({
  open,
  onClose,
  excludeMemberId,
  onCopy,
}: {
  open: boolean;
  onClose: () => void;
  excludeMemberId: string;
  onCopy: (plan: WorkoutPlanDTO, includeDetails: boolean) => void;
}) {
  const { data } = useFetch<MemberPlanListItem[]>(open ? '/api/workout-plans?status=with' : null);
  const [sourceId, setSourceId] = useState('');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [loading, setLoading] = useState(false);
  const options = (data ?? []).filter((i) => i.member._id !== excludeMemberId && i.plan);

  async function copy() {
    if (!sourceId) return;
    setLoading(true);
    try {
      const source = await fetcher<WorkoutPlanDTO | null>(`/api/workout-plans/${sourceId}`);
      if (!source) throw new Error('That member has no plan');
      onCopy(source, includeDetails);
      setSourceId('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not copy plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Copy from another member"
      description="Start from a similar member's routine, then tweak it. Their plan is not changed."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={copy} loading={loading} disabled={!sourceId} icon={<Copy className="h-4 w-4" />}>
            Copy days
          </Button>
        </>
      }
    >
      {data && options.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No other members have a plan yet.</p>
      ) : (
        <div className="space-y-4">
          <Select
            label="Member"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            placeholder={data ? 'Select a member…' : 'Loading…'}
            options={options.map((i) => ({
              value: i.member._id,
              label: `${i.member.name} — ${i.plan!.planTitle} (${i.plan!.dayCount} days)`,
            }))}
          />
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={includeDetails} onChange={(e) => setIncludeDetails(e.target.checked)} className="h-4 w-4 accent-[#00d4ff]" />
            Also copy plan title and trainer notes
          </label>
          <p className="text-xs text-warning">This replaces the days currently in the editor.</p>
        </div>
      )}
    </Modal>
  );
}

export default WorkoutPlanForm;
