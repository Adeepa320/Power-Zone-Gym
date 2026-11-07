'use client';

import { motion } from 'framer-motion';
import { ClipboardList, Printer, RefreshCw } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Loader';
import { PlanViewer } from '@/components/workout/PlanViewer';
import { DumbbellOutline, KettlebellOutline } from '@/components/landing/GymShapes';
import { GYM } from '@/lib/constants';
import type { WorkoutPlanDTO } from '@/types';

export default function MyWorkoutPlanPage() {
  const { user } = useAuth();
  // Poll so the trainer's edits show up without a manual refresh.
  const { data: plan, isLoading, isValidating, mutate } = useFetch<WorkoutPlanDTO | null>(user ? `/api/workout-plans/${user.id}` : null, {
    refreshInterval: 30_000,
  });

  const trainerName = plan && typeof plan.updatedBy === 'object' ? plan.updatedBy?.name : undefined;

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="My Workout Plan"
          description="Your personal day-by-day routine from your trainer."
          breadcrumbs={[{ label: 'Dashboard', href: '/member' }, { label: 'My Workout Plan' }]}
          actions={
            <>
              {plan && (
                <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                  Print
                </Button>
              )}
              <Button variant="ghost" size="sm" icon={<RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />} onClick={() => mutate()}>
                Refresh
              </Button>
            </>
          }
        />
      </div>

      {isLoading || plan === undefined ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-14 rounded-xl" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : plan ? (
        <PlanViewer plan={{ ...plan, trainerName, memberName: user?.name ?? undefined }} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass relative overflow-hidden rounded-3xl px-6 py-20 text-center">
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <motion.div className="absolute left-[10%] top-[20%] w-24 text-primary/30" animate={{ y: [0, -16, 0], rotate: [-10, 10, -10] }} transition={{ duration: 6, repeat: Infinity }}>
            <DumbbellOutline className="w-full" />
          </motion.div>
          <motion.div className="absolute bottom-[18%] right-[12%] w-14 text-violet/40" animate={{ y: [0, 14, 0] }} transition={{ duration: 5, repeat: Infinity }}>
            <KettlebellOutline className="w-full" />
          </motion.div>
          <div className="relative">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 to-violet/20 text-primary"
            >
              <ClipboardList className="h-9 w-9" />
            </motion.div>
            <h2 className="mt-6 text-2xl font-bold">Your plan is on its way</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Your trainer at {GYM.name} will prepare a personal day-by-day routine for you. It will appear here automatically — no need to wait for a
              WhatsApp message.
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}
