'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  ClipboardList,
  Clock,
  CreditCard,
  Dumbbell,
  Flame,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GYM, MEMBERSHIP_CATEGORIES, MEMBERSHIP_PRICING } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import type { SettingsDTO } from '@/types';
import { HeartbeatLine, HeroBackground } from './GymShapes';
import { Reveal } from './Reveal';
import { Typewriter } from './Typewriter';

export function Hero() {
  const words = ['Stronger.', 'Faster.', 'Unstoppable.', 'You.'];
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      <HeroBackground />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Now with online payments & digital workout charts
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            {GYM.name.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-gradient animate-gradient-x">{GYM.name.split(' ').slice(-1)}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 font-display text-2xl font-semibold text-white/90 sm:text-3xl"
          >
            Become <Typewriter words={words} className="text-primary" />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg"
          >
            {GYM.tagline} Expert coaching, personalised workout charts and effortless membership management — all in your
            pocket.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/register">
              <Button size="lg" glow iconRight={<ArrowRight className="h-4 w-4" />} className="min-w-[180px]">
                Join Now
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="min-w-[180px]">
                Member Login
              </Button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="mx-auto mt-12 max-w-md">
            <HeartbeatLine className="w-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function StatsStrip() {
  const stats = [
    { value: 500, suffix: '+', label: 'Active members' },
    { value: 12, suffix: '', label: 'Certified trainers' },
    { value: 80, suffix: '+', label: 'Machines & stations' },
    { value: 17, suffix: 'h', label: 'Open every weekday' },
  ];
  return (
    <section className="relative border-y border-white/5 bg-white/[0.02]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="text-center">
            <p className="font-display text-3xl font-bold sm:text-4xl">
              <AnimatedCounter value={s.value} />
              <span className="text-primary">{s.suffix}</span>
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const features = [
  { icon: ClipboardList, title: 'Personal workout charts', text: 'Trainers build charts exercise-by-exercise and assign them straight to your dashboard.', color: '#00d4ff' },
  { icon: CalendarCheck, title: 'One-tap check-in', text: 'Mark attendance as you walk in and watch your streak grow day after day.', color: '#00ff88' },
  { icon: CreditCard, title: 'Pay online in seconds', text: 'Secure card payments via Stripe — or pay cash at the desk. Your choice.', color: '#ffaa00' },
  { icon: BarChart3, title: 'Track your progress', text: 'Weight history, BMI and monthly attendance — your fitness story in numbers.', color: '#8b5cf6' },
  { icon: Dumbbell, title: 'Premium equipment', text: 'Free weights, machines and a full cardio deck maintained to the highest standard.', color: '#ff6b35' },
  { icon: ShieldCheck, title: 'Expert coaches', text: 'Certified personal trainers who tailor every plan to your body and goals.', color: '#38bdf8' },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Why Power Zone</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Everything you need to train smarter</h2>
          <p className="mt-4 text-muted">A modern gym experience — from the weights floor to your phone.</p>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -6 }}
                className="glass group relative h-full overflow-hidden rounded-2xl p-6 transition-colors hover:border-white/20"
              >
                <div
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                  style={{ background: f.color }}
                />
                <span
                  className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}1a`, color: f.color }}
                >
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="relative text-lg font-semibold">{f.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Plans() {
  const { data } = useFetch<SettingsDTO>('/api/settings', { revalidateOnFocus: false });
  const pricing = data?.pricing ?? MEMBERSHIP_PRICING;

  return (
    <section id="plans" className="relative scroll-mt-20 py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Membership</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Simple monthly plans</h2>
          <p className="mt-4 text-muted">No joining fee. No lock-in. Change your plan any time at the front desk.</p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {MEMBERSHIP_CATEGORIES.map((plan, i) => {
            const featured = plan.value === 'cardio';
            return (
              <Reveal key={plan.value} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className={`glass relative flex h-full flex-col overflow-hidden rounded-3xl p-7 ${featured ? 'border-primary/40 shadow-glow' : ''}`}
                >
                  {featured && (
                    <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-950">
                      <Flame className="h-3 w-3" /> Popular
                    </span>
                  )}
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: plan.color }} />
                  <span className="text-4xl">{plan.emoji}</span>
                  <h3 className="mt-4 text-xl font-semibold">{plan.label}</h3>
                  <p className="mt-1 text-sm text-muted">{plan.description}</p>
                  <p className="mt-6 font-display text-4xl font-bold">
                    {formatCurrency(pricing[plan.value])}
                    <span className="text-sm font-normal text-muted"> /month</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${plan.color}22`, color: plan.color }}>
                          <Check className="h-3 w-3" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/register?plan=${plan.value}`} className="mt-8">
                    <Button fullWidth variant={featured ? 'primary' : 'secondary'}>
                      Choose {plan.short}
                    </Button>
                  </Link>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function InfoCards() {
  return (
    <section id="info" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Visit Us</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Come train with us</h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Reveal>
            <div className="glass h-full rounded-2xl p-6">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold">Operating Hours</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {GYM.hours.map((h) => (
                  <li key={h.days} className="flex justify-between gap-4 border-b border-white/5 pb-2.5 last:border-0">
                    <span className="text-muted">{h.days}</span>
                    <span className="font-medium">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass h-full rounded-2xl p-6">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <MapPin className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold">Location</h3>
              <p className="mt-4 text-sm text-muted">{GYM.address}</p>
              {/* ADD GYM PHOTO / MAP EMBED HERE LATER */}
              <div className="relative mt-5 h-28 overflow-hidden rounded-xl border border-white/10 bg-ink-800">
                <div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] opacity-60" />
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <MapPin className="h-8 w-8 fill-success/20 text-success" />
                </motion.div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="glass h-full rounded-2xl p-6">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Phone className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold">Contact</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <p className="text-xs uppercase tracking-wider text-muted">Phone</p>
                  <a href={`tel:${GYM.phone.replace(/\s/g, '')}`} className="font-medium hover:text-primary">
                    {GYM.phone}
                  </a>
                </li>
                <li>
                  <p className="text-xs uppercase tracking-wider text-muted">Email</p>
                  <a href={`mailto:${GYM.email}`} className="font-medium hover:text-primary">
                    {GYM.email}
                  </a>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="relative px-4 pb-24 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-violet/15 to-[#ff6b35]/15 p-10 text-center sm:p-16">
          <div className="absolute inset-0 bg-dot-pattern bg-dots opacity-40" />
          <motion.div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />
          <div className="relative">
            <Zap className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Your first rep starts today</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">Register in under two minutes. Your trainer will have a chart ready for you on day one.</p>
            <Link href="/register" className="mt-8 inline-block">
              <Button size="lg" glow iconRight={<ArrowRight className="h-4 w-4" />}>
                Start your membership
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
