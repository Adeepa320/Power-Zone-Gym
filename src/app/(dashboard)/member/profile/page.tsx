'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Activity, Camera, HeartPulse, Home, Mail, Phone, Ruler, Save, Scale, Target, Trash2, UserRound, Wallet } from 'lucide-react';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, staggerContainer } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Loader';
import { CategoryBadge } from '@/components/dashboard/MemberTable';
import { WeightChart } from '@/components/dashboard/WeightChart';
import { memberSelfUpdateSchema, type MemberSelfUpdateInput } from '@/lib/validations';
import { FITNESS_GOALS, MAX_PROFILE_IMAGE_BYTES } from '@/lib/constants';
import { bmi, dataUrlBytes, fileToDataUrl, formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { MemberStats, UserDTO } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: member, mutate } = useFetch<UserDTO>(user ? `/api/members/${user.id}` : null);
  const { data: stats } = useFetch<MemberStats>('/api/dashboard/stats');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<MemberSelfUpdateInput>({ resolver: zodResolver(memberSelfUpdateSchema) });

  useEffect(() => {
    if (member) {
      reset({
        phone: member.phone,
        address: member.address,
        weight: member.weight,
        height: member.height,
        healthConditions: member.healthConditions ?? '',
        fitnessGoal: member.fitnessGoal,
      });
    }
  }, [member, reset]);

  async function save(payload: MemberSelfUpdateInput, message = 'Profile updated') {
    try {
      await apiRequest(`/api/members/${user!.id}`, 'PUT', payload);
      toast.success(message);
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function onSubmit(values: MemberSelfUpdateInput) {
    const payload = Object.fromEntries(Object.entries(values).filter(([k]) => dirtyFields[k as keyof MemberSelfUpdateInput]));
    await save(payload, payload.weight !== undefined ? 'Profile updated · weight logged 📈' : 'Profile updated');
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file, 320, 0.85);
      if (dataUrlBytes(dataUrl) > MAX_PROFILE_IMAGE_BYTES) {
        toast.error('Photo is too large (max 300KB after compression)');
        return;
      }
      await save({ profileImage: dataUrl }, 'Profile photo updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load photo');
    }
  }

  if (!member) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[480px] rounded-2xl" />
        <Skeleton className="h-[480px] rounded-2xl lg:col-span-2" />
      </div>
    );
  }

  const memberBmi = bmi(member.weight, member.height);
  const firstWeight = member.weightHistory?.[0]?.weight;
  const weightDelta = firstWeight !== undefined ? Math.round((member.weight - firstWeight) * 10) / 10 : 0;

  return (
    <>
      <PageHeader title="My Profile" description="Your personal and body details." breadcrumbs={[{ label: 'Dashboard', href: '/member' }, { label: 'Profile' }]} />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="overflow-hidden text-center">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary/25 via-violet/20 to-transparent" />
            <div className="relative pt-4">
              <div className="group relative mx-auto w-fit">
                <Avatar name={member.name} src={member.profileImage} size="xl" ring />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100"
                  aria-label="Change photo"
                >
                  <Camera className="h-6 w-6" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </div>
              <h2 className="mt-4 text-xl font-semibold">{member.name}</h2>
              <p className="text-sm text-muted">{member.email}</p>
              <div className="mt-3 flex justify-center gap-2">
                <Button size="sm" variant="secondary" icon={<Camera className="h-3.5 w-3.5" />} onClick={() => fileRef.current?.click()}>
                  {member.profileImage ? 'Change photo' : 'Add photo'}
                </Button>
                {member.profileImage && (
                  <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => save({ profileImage: '' }, 'Photo removed')}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <ul className="relative mt-6 space-y-3 text-left text-sm">
              {[
                { icon: Mail, label: 'Email', value: member.email },
                { icon: UserRound, label: 'Age / Gender', value: `${member.age} · ${member.gender}` },
                { icon: Activity, label: 'Body type', value: member.bodyType },
              ].map((d) => (
                <li key={d.label} className="flex items-start gap-3">
                  <d.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted">{d.label}</p>
                    <p className="capitalize">{d.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Membership" icon={<Wallet />} />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Category</span>
                <CategoryBadge category={member.membershipCategory} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Monthly fee</span>
                <span className="font-semibold">{stats ? formatCurrency(stats.monthlyFee) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Member since</span>
                <span>{formatDate(member.registeredDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Status</span>
                <Badge tone={member.isActive ? 'success' : 'neutral'} dot pulse={member.isActive}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="pt-2 text-xs text-muted">To change your plan, speak to the front desk.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Scale, label: 'Weight', value: `${member.weight} kg`, sub: weightDelta ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg since joining` : 'Starting weight', color: 'text-success' },
              { icon: Ruler, label: 'Height', value: `${member.height} cm`, sub: 'Height', color: 'text-primary' },
              { icon: HeartPulse, label: 'BMI', value: memberBmi ? String(memberBmi.value) : '—', sub: memberBmi?.label ?? '', color: 'text-warning' },
            ].map((s) => (
              <Card key={s.label} padding="sm">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                  {s.label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted">{s.sub}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader title="Weight Progress" description="Every weight update is logged" icon={<Scale />} />
            <WeightChart history={member.weightHistory ?? []} />
          </Card>

          <Card>
            <CardHeader title="Edit Details" description="Keep your contact and body details up to date" icon={<UserRound />} />
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
              <Input label="Phone" icon={<Phone />} error={errors.phone?.message} {...register('phone')} />
              <Select label="Fitness goal" icon={<Target />} options={FITNESS_GOALS.map((g) => ({ value: g, label: g }))} {...register('fitnessGoal')} />
              <Input label="Address" icon={<Home />} wrapperClassName="sm:col-span-2" error={errors.address?.message} {...register('address')} />
              <Input label="Weight" type="number" step="0.1" suffix="kg" icon={<Scale />} hint="Changes are tracked over time" error={errors.weight?.message} {...register('weight')} />
              <Input label="Height" type="number" suffix="cm" icon={<Ruler />} error={errors.height?.message} {...register('height')} />
              <Textarea label="Health conditions" wrapperClassName="sm:col-span-2" rows={2} placeholder="Let your trainer know about injuries or conditions" {...register('healthConditions')} />
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" loading={isSubmitting} disabled={!isDirty} icon={<Save className="h-4 w-4" />}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </motion.div>
    </>
  );
}
