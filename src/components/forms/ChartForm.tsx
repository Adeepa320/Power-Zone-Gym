'use client';

import { useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GripVertical, ImagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import { chartSchema, type ChartInput } from '@/lib/validations';
import { CHART_CATEGORIES } from '@/lib/constants';
import { dataUrlBytes, fileToDataUrl } from '@/lib/utils';
import { MAX_CHART_IMAGE_BYTES } from '@/lib/constants';
import { apiRequest } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import type { WorkoutChartDTO } from '@/types';

const emptyExercise = { name: '', sets: 3, reps: '12', restTime: '60 sec', notes: '' };

/** Create / edit a workout chart with a dynamic list of exercises. */
export function ChartForm({
  chart,
  onSuccess,
  onCancel,
}: {
  chart?: WorkoutChartDTO | null;
  onSuccess?: (chart: WorkoutChartDTO) => void;
  onCancel?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChartInput>({
    resolver: zodResolver(chartSchema),
    defaultValues: chart
      ? {
          title: chart.title,
          category: chart.category,
          description: chart.description ?? '',
          chartImage: chart.chartImage ?? '',
          exercises: chart.exercises.map((e) => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            restTime: e.restTime,
            notes: e.notes ?? '',
            imageUrl: e.imageUrl ?? '',
          })),
        }
      : { title: '', category: 'chest', description: '', chartImage: '', exercises: [{ ...emptyExercise }] },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'exercises' });
  const chartImage = watch('chartImage');

  async function onImage(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file, 1600, 0.85);
      if (dataUrlBytes(dataUrl) > MAX_CHART_IMAGE_BYTES) {
        toast.error('Image is too large even after compression (max 1.5MB)');
        return;
      }
      setValue('chartImage', dataUrl, { shouldDirty: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load image');
    }
  }

  async function onSubmit(values: ChartInput) {
    try {
      const saved = chart
        ? await apiRequest<WorkoutChartDTO>(`/api/charts/${chart._id}`, 'PUT', values)
        : await apiRequest<WorkoutChartDTO>('/api/charts', 'POST', values);
      toast.success(chart ? 'Chart updated — assigned members see it now' : 'Workout chart created');
      onSuccess?.(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save chart');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Chart title" required placeholder="Beginner Chest Day" error={errors.title?.message} {...register('title')} />
        <Select label="Category" required options={CHART_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} error={errors.category?.message} {...register('category')} />
        <Textarea label="Description" placeholder="Goal of this program, frequency, warm-up notes…" wrapperClassName="sm:col-span-2" rows={2} {...register('description')} />
      </div>

      {/* Chart image upload */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">Chart image (optional)</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
        {chartImage ? (
          <div className="relative overflow-hidden rounded-xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={chartImage} alt="Chart preview" className="max-h-56 w-full bg-black/30 object-contain" />
            <button
              type="button"
              onClick={() => setValue('chartImage', '', { shouldDirty: true })}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-danger"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 py-8 text-sm text-muted transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <ImagePlus className="h-6 w-6" />
            Upload the chart image you share on WhatsApp
            <span className="text-xs text-muted/60">PNG or JPG — compressed automatically</span>
          </button>
        )}
      </div>

      {/* Exercises */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Exercises <span className="text-primary">({fields.length})</span>
          </p>
          <Button size="sm" variant="outline" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => append({ ...emptyExercise })}>
            Add exercise
          </Button>
        </div>
        {errors.exercises?.root?.message && <p className="mb-2 text-xs text-danger">{errors.exercises.root.message}</p>}
        {errors.exercises?.message && <p className="mb-2 text-xs text-danger">{errors.exercises.message}</p>}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                layout
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <GripVertical className="h-4 w-4 text-muted" />
                      Exercise {index + 1}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded-md px-2 py-1 text-xs text-muted hover:bg-white/10 disabled:opacity-30" aria-label="Move up">
                        ↑
                      </button>
                      <button type="button" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)} className="rounded-md px-2 py-1 text-xs text-muted hover:bg-white/10 disabled:opacity-30" aria-label="Move down">
                        ↓
                      </button>
                      <button type="button" disabled={fields.length === 1} onClick={() => remove(index)} className="rounded-md p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-30" aria-label="Remove exercise">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-12">
                    <Input placeholder="Exercise name (e.g. Bench Press)" wrapperClassName="sm:col-span-12" error={errors.exercises?.[index]?.name?.message} {...register(`exercises.${index}.name`)} />
                    <Input label="Sets" type="number" wrapperClassName="sm:col-span-3" error={errors.exercises?.[index]?.sets?.message} {...register(`exercises.${index}.sets`)} />
                    <Input label="Reps" placeholder="12 or 12-15" wrapperClassName="sm:col-span-4" error={errors.exercises?.[index]?.reps?.message} {...register(`exercises.${index}.reps`)} />
                    <Input label="Rest" placeholder="60 sec" wrapperClassName="sm:col-span-5" error={errors.exercises?.[index]?.restTime?.message} {...register(`exercises.${index}.restTime`)} />
                    <Input placeholder="Notes — form cues, tempo, drop sets… (optional)" wrapperClassName="sm:col-span-12" {...register(`exercises.${index}.notes`)} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} icon={<Save className="h-4 w-4" />}>
          {chart ? 'Save changes' : 'Create chart'}
        </Button>
      </div>
    </form>
  );
}

export default ChartForm;
