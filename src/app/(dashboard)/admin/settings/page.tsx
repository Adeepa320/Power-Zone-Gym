'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Banknote, Info, Save, Settings } from 'lucide-react';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Loader';
import { MEMBERSHIP_CATEGORIES, MEMBERSHIP_PRICING } from '@/lib/constants';
import { settingsSchema, type SettingsInput } from '@/lib/validations';
import { formatCurrency } from '@/lib/utils';
import type { SettingsDTO } from '@/types';

export default function SettingsPage() {
  const { data, isLoading, mutate } = useFetch<SettingsDTO>('/api/settings');
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { pricing: { ...MEMBERSHIP_PRICING }, applyToPending: true },
  });

  useEffect(() => {
    if (data) reset({ pricing: data.pricing, applyToPending: true });
  }, [data, reset]);

  async function onSubmit(values: SettingsInput) {
    try {
      const res = await apiRequest<{ repriced: number }>('/api/settings', 'PUT', values);
      toast.success(res.repriced > 0 ? `Pricing saved · ${res.repriced} pending payments updated` : 'Pricing saved');
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save settings');
    }
  }

  const pricing = watch('pricing');

  return (
    <>
      <PageHeader title="Settings" description="Configure membership pricing." breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]} />

      <motion.form variants={staggerContainer} initial="hidden" animate="show" onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3" noValidate>
        <Card className="lg:col-span-2">
          <CardHeader title="Membership Pricing" description="Monthly fee charged for each category (Rs.)" icon={<Banknote />} />
          {isLoading && !data ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {MEMBERSHIP_CATEGORIES.map((c) => (
                <div key={c.value} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: `${c.color}1a` }}>
                      {c.emoji}
                    </span>
                    <div>
                      <p className="font-semibold">{c.label}</p>
                      <p className="text-xs text-muted">{c.description}</p>
                    </div>
                  </div>
                  <Input type="number" min={0} step={100} suffix="/month" wrapperClassName="sm:w-48" error={errors.pricing?.[c.value]?.message} {...register(`pricing.${c.value}`)} />
                </div>
              ))}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#00d4ff]" {...register('applyToPending')} />
                <span>
                  <span className="font-medium">Apply to this month&apos;s pending payments</span>
                  <span className="block text-xs text-muted">Unpaid payments for the current month will be re-priced. Paid and overdue records are never changed.</span>
                </span>
              </label>
            </div>
          )}
          <div className="mt-6 flex justify-end border-t border-white/10 pt-5">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty} icon={<Save className="h-4 w-4" />}>
              Save pricing
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Preview" description="As shown to new members" icon={<Settings />} />
          <div className="space-y-3">
            {MEMBERSHIP_CATEGORIES.map((c) => (
              <div key={c.value} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <span className="text-sm">
                  {c.emoji} {c.label}
                </span>
                <span className="font-display font-bold">{formatCurrency(Number(pricing?.[c.value]) || 0)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted">
            <Info className="h-4 w-4 shrink-0 text-primary" />
            New monthly dues are generated automatically using these prices on the first visit of each month.
          </div>
        </Card>
      </motion.form>
    </>
  );
}
