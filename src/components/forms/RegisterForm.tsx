'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Home,
  Lock,
  Mail,
  Phone,
  Ruler,
  Scale,
  User,
  UserRound,
  Wallet,
} from 'lucide-react';
import { registerFormSchema, type RegisterFormInput } from '@/lib/validations';
import { BODY_TYPES, FITNESS_GOALS, GYM, MEMBERSHIP_CATEGORIES, MEMBERSHIP_PRICING } from '@/lib/constants';
import { bmi, categoryLabel, cn, formatCurrency } from '@/lib/utils';
import { apiRequest, useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { SuccessBurst } from '@/components/ui/SuccessBurst';
import type { MembershipCategory, SettingsDTO } from '@/types';

const STEPS = [
  { title: 'Personal Info', icon: UserRound },
  { title: 'Physical Details', icon: HeartPulse },
  { title: 'Membership', icon: Wallet },
  { title: 'Review', icon: ClipboardCheck },
] as const;

const STEP_FIELDS: FieldPath<RegisterFormInput>[][] = [
  ['name', 'email', 'password', 'confirmPassword', 'phone', 'address', 'age', 'gender'],
  ['weight', 'height', 'bodyType', 'fitnessGoal', 'healthConditions'],
  ['membershipCategory'],
  [],
];

interface RegisterFormProps {
  /** "admin" = used inside the admin panel to add a member (no auto sign-in). */
  mode?: 'public' | 'admin';
  defaultPlan?: MembershipCategory;
  onSuccess?: (member: { _id: string; name: string }) => void;
}

export function RegisterForm({ mode = 'public', defaultPlan, onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState<{ name: string } | null>(null);
  const { data: settings } = useFetch<SettingsDTO>('/api/settings', { revalidateOnFocus: false });
  const pricing = settings?.pricing ?? MEMBERSHIP_PRICING;

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onTouched',
    defaultValues: {
      gender: undefined,
      healthConditions: '',
      membershipCategory: defaultPlan ?? 'normal',
    },
  });

  const values = watch();

  async function next() {
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (step === 0) {
      const { password, confirmPassword } = getValues();
      if (password !== confirmPassword) {
        setError('confirmPassword', { message: 'Passwords do not match' });
        return;
      }
    }
    if (!valid) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function goTo(target: number) {
    if (target < step) {
      setDirection(-1);
      setStep(target);
    }
  }

  async function onSubmit(data: RegisterFormInput) {
    try {
      const payload: Partial<RegisterFormInput> = { ...data };
      delete payload.confirmPassword;
      const member = await apiRequest<{ _id: string; name: string }>('/api/members', 'POST', payload);

      if (mode === 'admin') {
        toast.success(`${member.name} has been registered`);
        onSuccess?.(member);
        return;
      }
      setDone({ name: member.name });
      // Sign the new member in automatically.
      await signIn('credentials', { email: data.email, password: data.password, redirect: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
      // Email conflicts belong to step 1.
      if (err instanceof Error && /email/i.test(err.message)) {
        setError('email', { message: err.message });
        setDirection(-1);
        setStep(0);
      }
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong relative w-full max-w-lg overflow-hidden rounded-3xl p-8 text-center sm:p-12"
      >
        <div className="flex justify-center">
          <SuccessBurst />
        </div>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-2xl font-bold">
          Welcome to the Zone, {done.name.split(' ')[0]}! 🎉
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-3 text-sm text-muted">
          Your membership has been created. Your first month&apos;s fee of{' '}
          <span className="font-semibold text-white">{formatCurrency(pricing[values.membershipCategory])}</span> is ready to pay online
          or at the front desk.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={() => router.push('/member')} iconRight={<ArrowRight className="h-4 w-4" />}>
            Go to my dashboard
          </Button>
          <Link href="/">
            <Button size="lg" variant="ghost" fullWidth>
              Back home
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const bmiValue = bmi(Number(values.weight), Number(values.height));

  return (
    <div className={cn('w-full', mode === 'public' ? 'glass-strong max-w-2xl rounded-3xl p-6 sm:p-10' : '')}>
      {mode === 'public' && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Join {GYM.name}</h1>
          <p className="mt-1 text-sm text-muted">Four quick steps and you&apos;re in.</p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-8">
        <div className="mb-4 flex justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const state = i < step ? 'done' : i === step ? 'active' : 'todo';
            return (
              <button
                key={s.title}
                type="button"
                onClick={() => goTo(i)}
                disabled={i >= step}
                className="group flex flex-1 flex-col items-center gap-2 disabled:cursor-default"
              >
                <motion.span
                  animate={{ scale: state === 'active' ? 1.1 : 1 }}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
                    state === 'done' && 'border-success/40 bg-success/15 text-success',
                    state === 'active' && 'border-primary/50 bg-primary/15 text-primary shadow-glow',
                    state === 'todo' && 'border-white/10 bg-white/5 text-muted',
                  )}
                >
                  {state === 'done' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </motion.span>
                <span className={cn('hidden text-[11px] font-medium sm:block', state === 'todo' ? 'text-muted' : 'text-white')}>{s.title}</span>
              </button>
            );
          })}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-violet to-[#ff6b35]"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="relative min-h-[380px] overflow-hidden px-0.5">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Full name" required icon={<User />} placeholder="Kasun Perera" error={errors.name?.message} wrapperClassName="sm:col-span-2" {...register('name')} />
                  <Input label="Email" required type="email" icon={<Mail />} placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
                  <Input label="Phone" required type="tel" icon={<Phone />} placeholder="+94 77 123 4567" error={errors.phone?.message} {...register('phone')} />
                  <Input label="Password" required type="password" icon={<Lock />} autoComplete="new-password" placeholder="Min 8 chars, letters & numbers" error={errors.password?.message} {...register('password')} />
                  <Input label="Confirm password" required type="password" icon={<Lock />} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
                  <Input label="Address" required icon={<Home />} placeholder="Street, City" error={errors.address?.message} wrapperClassName="sm:col-span-2" {...register('address')} />
                  <Input label="Age" required type="number" inputMode="numeric" placeholder="25" error={errors.age?.message} {...register('age')} />
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium uppercase tracking-wider text-muted">
                      Gender<span className="ml-0.5 text-primary">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['male', 'female'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setValue('gender', g, { shouldValidate: true })}
                          className={cn(
                            'h-11 rounded-xl border text-sm capitalize transition',
                            values.gender === g ? 'border-primary/60 bg-primary/15 text-primary' : 'border-white/10 bg-white/[0.04] text-muted hover:border-white/20',
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {errors.gender && <p className="text-xs text-danger">{errors.gender.message}</p>}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Weight" required type="number" step="0.1" icon={<Scale />} suffix="kg" placeholder="70" error={errors.weight?.message} {...register('weight')} />
                  <Input label="Height" required type="number" icon={<Ruler />} suffix="cm" placeholder="172" error={errors.height?.message} {...register('height')} />
                  {bmiValue && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="sm:col-span-2">
                      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                        <span className="text-muted">Your BMI</span>
                        <span className="font-semibold">
                          {bmiValue.value} <span className="font-normal text-primary">· {bmiValue.label}</span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                  <Select label="Body type" required placeholder="Select body type" options={BODY_TYPES.map((b) => ({ value: b, label: b }))} error={errors.bodyType?.message} {...register('bodyType')} />
                  <Select label="Fitness goal" required placeholder="Select your goal" options={FITNESS_GOALS.map((g) => ({ value: g, label: g }))} error={errors.fitnessGoal?.message} {...register('fitnessGoal')} />
                  <Textarea label="Health conditions" placeholder="Injuries, allergies, medical conditions… (optional)" wrapperClassName="sm:col-span-2" error={errors.healthConditions?.message} {...register('healthConditions')} />
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4">
                  {MEMBERSHIP_CATEGORIES.map((plan) => {
                    const selected = values.membershipCategory === plan.value;
                    return (
                      <motion.button
                        key={plan.value}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setValue('membershipCategory', plan.value, { shouldValidate: true })}
                        className={cn(
                          'relative flex items-center gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-colors',
                          selected ? 'bg-white/[0.07]' : 'border-white/10 bg-white/[0.03] hover:border-white/20',
                        )}
                        style={selected ? { borderColor: plan.color, boxShadow: `0 0 24px ${plan.color}33` } : undefined}
                      >
                        <span className="text-3xl">{plan.emoji}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{plan.label}</p>
                          <p className="mt-0.5 text-xs text-muted">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg font-bold">{formatCurrency(pricing[plan.value])}</p>
                          <p className="text-[10px] uppercase tracking-wider text-muted">per month</p>
                        </div>
                        <span
                          className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition', selected ? 'border-transparent' : 'border-white/20')}
                          style={selected ? { background: plan.color } : undefined}
                        >
                          {selected && <Check className="h-3.5 w-3.5 text-ink-950" />}
                        </span>
                      </motion.button>
                    );
                  })}
                  {errors.membershipCategory && <p className="text-xs text-danger">{errors.membershipCategory.message}</p>}
                  <p className="text-xs text-muted">Prices are set by the gym and may change. You can switch plans later at the front desk.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <ReviewBlock
                    title="Personal info"
                    onEdit={() => goTo(0)}
                    rows={[
                      ['Name', values.name],
                      ['Email', values.email],
                      ['Phone', values.phone],
                      ['Address', values.address],
                      ['Age', String(values.age ?? '')],
                      ['Gender', values.gender],
                    ]}
                  />
                  <ReviewBlock
                    title="Physical details"
                    onEdit={() => goTo(1)}
                    rows={[
                      ['Weight', `${values.weight} kg`],
                      ['Height', `${values.height} cm`],
                      ['BMI', bmiValue ? `${bmiValue.value} (${bmiValue.label})` : '—'],
                      ['Body type', values.bodyType],
                      ['Goal', values.fitnessGoal],
                      ['Health', values.healthConditions || 'None'],
                    ]}
                  />
                  <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-violet/10 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted">Membership</p>
                      <p className="mt-1 font-semibold">{categoryLabel(values.membershipCategory)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-muted">First month</p>
                      <p className="mt-1 font-display text-xl font-bold text-primary">{formatCurrency(pricing[values.membershipCategory])}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || isSubmitting} icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} iconRight={<ArrowRight className="h-4 w-4" />}>
              Continue
            </Button>
          ) : (
            <Button type="submit" variant="success" loading={isSubmitting} icon={<CheckCircle2 className="h-4 w-4" />}>
              {mode === 'admin' ? 'Register member' : 'Confirm & Join'}
            </Button>
          )}
        </div>
      </form>

      {mode === 'public' && (
        <p className="mt-6 text-center text-sm text-muted">
          Already a member?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}

function ReviewBlock({ title, rows, onEdit }: { title: string; rows: [string, string | undefined][]; onEdit: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <button type="button" onClick={onEdit} className="text-xs text-primary hover:underline">
          Edit
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-white/5 pb-2">
            <dt className="text-muted">{k}</dt>
            <dd className="truncate text-right capitalize">{v || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default RegisterForm;
