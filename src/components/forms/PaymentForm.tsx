'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Banknote, CalendarDays, UserRound } from 'lucide-react';
import { markCashSchema, type MarkCashInput } from '@/lib/validations';
import { MEMBERSHIP_PRICING, MONTHS } from '@/lib/constants';
import { categoryLabel, currentMonthYear, formatCurrency } from '@/lib/utils';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import type { MemberSummary, PaymentDTO, SettingsDTO } from '@/types';

/**
 * Admin "Mark Cash Payment" form.
 * Select member → confirm amount → mark as paid. Records the admin & timestamp server-side.
 */
export function PaymentForm({
  defaultMemberId,
  defaultMonth,
  defaultYear,
  onSuccess,
  onCancel,
}: {
  defaultMemberId?: string;
  defaultMonth?: number;
  defaultYear?: number;
  onSuccess?: (payment: PaymentDTO) => void;
  onCancel?: () => void;
}) {
  const now = currentMonthYear();
  const { data: members, isLoading } = useFetch<MemberSummary[]>('/api/members?lite=1');
  const { data: settings } = useFetch<SettingsDTO>('/api/settings');
  const pricing = settings?.pricing ?? MEMBERSHIP_PRICING;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<MarkCashInput>({
    resolver: zodResolver(markCashSchema),
    defaultValues: {
      memberId: defaultMemberId ?? '',
      month: defaultMonth ?? now.month,
      year: defaultYear ?? now.year,
      amount: undefined,
    },
  });

  const memberId = watch('memberId');
  const month = Number(watch('month'));
  const year = Number(watch('year'));
  const selected = useMemo(() => members?.find((m) => m._id === memberId), [members, memberId]);

  // Look up this member's record for the chosen month to prefill the expected amount.
  const { data: memberPayments } = useFetch<PaymentDTO[]>(memberId ? `/api/payments?memberId=${memberId}` : null);
  const existing = memberPayments?.find((p) => p.month === month && p.year === year);

  useEffect(() => {
    if (!selected || dirtyFields.amount) return;
    setValue('amount', existing?.amount ?? pricing[selected.membershipCategory]);
  }, [selected, existing, pricing, setValue, dirtyFields.amount]);

  async function onSubmit(values: MarkCashInput) {
    try {
      const payment = await apiRequest<PaymentDTO>('/api/payments/mark-cash', 'POST', values);
      toast.success(`Cash payment recorded for ${selected?.name ?? 'member'}`);
      onSuccess?.(payment);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record payment');
    }
  }

  const years = Array.from({ length: 4 }, (_, i) => now.year - 2 + i);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Select
        label="Member"
        required
        icon={<UserRound />}
        placeholder={isLoading ? 'Loading members…' : 'Select a member'}
        options={(members ?? []).map((m) => ({ value: m._id, label: `${m.name} — ${categoryLabel(m.membershipCategory)}` }))}
        error={errors.memberId?.message}
        // Locked (not disabled — disabled fields are dropped from the submission)
        className={defaultMemberId ? 'pointer-events-none opacity-70' : undefined}
        tabIndex={defaultMemberId ? -1 : undefined}
        {...register('memberId')}
      />

      {selected && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Avatar name={selected.name} src={selected.profileImage} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selected.name}</p>
            <p className="truncate text-xs text-muted">{selected.phone ?? selected.email}</p>
          </div>
          {existing && (
            <span
              className={`text-xs font-medium ${existing.paymentStatus === 'paid' ? 'text-success' : existing.paymentStatus === 'overdue' ? 'text-danger' : 'text-warning'}`}
            >
              {existing.paymentStatus === 'paid' ? 'Already paid' : `Due ${formatCurrency(existing.amount)}`}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Month"
          icon={<CalendarDays />}
          options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
          error={errors.month?.message}
          {...register('month')}
        />
        <Select label="Year" options={years.map((y) => ({ value: y, label: String(y) }))} error={errors.year?.message} {...register('year')} />
      </div>

      <Input
        label="Amount (Rs.)"
        required
        type="number"
        icon={<Banknote />}
        placeholder="3000"
        error={errors.amount?.message}
        hint={selected ? `Standard fee for ${categoryLabel(selected.membershipCategory)}: ${formatCurrency(pricing[selected.membershipCategory])}` : undefined}
        {...register('amount')}
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="success" loading={isSubmitting} disabled={existing?.paymentStatus === 'paid'} icon={<Banknote className="h-4 w-4" />}>
          Mark as Paid (Cash)
        </Button>
      </div>
    </form>
  );
}

export default PaymentForm;
