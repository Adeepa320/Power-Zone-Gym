'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { KeyRound, Save } from 'lucide-react';
import { adminMemberUpdateSchema, type AdminMemberUpdateInput } from '@/lib/validations';
import { BODY_TYPES, FITNESS_GOALS, MEMBERSHIP_CATEGORIES } from '@/lib/constants';
import { apiRequest } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import type { UserDTO } from '@/types';

/** Admin form to edit every field of a member (including category and password reset). */
export function MemberEditForm({
  member,
  onSuccess,
  onCancel,
}: {
  member: UserDTO;
  onSuccess?: (m: UserDTO) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<AdminMemberUpdateInput>({
    resolver: zodResolver(adminMemberUpdateSchema),
    defaultValues: {
      name: member.name,
      email: member.email,
      phone: member.phone,
      address: member.address,
      age: member.age,
      gender: member.gender,
      weight: member.weight,
      height: member.height,
      bodyType: member.bodyType,
      healthConditions: member.healthConditions ?? '',
      fitnessGoal: member.fitnessGoal,
      membershipCategory: member.membershipCategory,
      password: undefined,
    },
  });

  async function onSubmit(values: AdminMemberUpdateInput) {
    // Only send fields that changed; drop an empty password.
    const payload = Object.fromEntries(
      Object.entries(values).filter(([k, v]) => dirtyFields[k as keyof AdminMemberUpdateInput] && v !== '' && v !== undefined),
    );
    if (Object.keys(payload).length === 0) {
      toast('No changes to save');
      return;
    }
    try {
      const updated = await apiRequest<UserDTO>(`/api/members/${member._id}`, 'PUT', payload);
      toast.success('Member updated');
      onSuccess?.(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Input label="Age" type="number" error={errors.age?.message} {...register('age')} />
        <Input label="Address" wrapperClassName="sm:col-span-2" error={errors.address?.message} {...register('address')} />
        <Select label="Gender" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} {...register('gender')} />
        <Select
          label="Membership category"
          options={MEMBERSHIP_CATEGORIES.map((c) => ({ value: c.value, label: `${c.emoji} ${c.label}` }))}
          hint="Changing category updates this month's unpaid fee"
          {...register('membershipCategory')}
        />
        <Input label="Weight" type="number" step="0.1" suffix="kg" error={errors.weight?.message} {...register('weight')} />
        <Input label="Height" type="number" suffix="cm" error={errors.height?.message} {...register('height')} />
        <Select label="Body type" options={BODY_TYPES.map((b) => ({ value: b, label: b }))} {...register('bodyType')} />
        <Select label="Fitness goal" options={FITNESS_GOALS.map((g) => ({ value: g, label: g }))} {...register('fitnessGoal')} />
        <Textarea label="Health conditions" wrapperClassName="sm:col-span-2" rows={2} {...register('healthConditions')} />
        <Input
          label="Reset password"
          type="password"
          icon={<KeyRound />}
          placeholder="Leave blank to keep current password"
          autoComplete="new-password"
          wrapperClassName="sm:col-span-2"
          error={errors.password?.message}
          {...register('password', { setValueAs: (v: string) => (v === '' ? undefined : v) })}
        />
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} icon={<Save className="h-4 w-4" />}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

export default MemberEditForm;
