'use client';

import { motion } from 'framer-motion';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Loader';
import { ChartViewer } from '@/components/charts/ChartViewer';
import { DumbbellOutline, KettlebellOutline } from '@/components/landing/GymShapes';
import { GYM } from '@/lib/constants';
import type { UserDTO, WorkoutChartDTO } from '@/types';

export default function MyChartPage() {
  const { user } = useAuth();
  // Poll so admin edits/assignments show up without a manual refresh.
  const { data, isLoading, isValidating, mutate } = useFetch<UserDTO>(user ? `/api/members/${user.id}` : null, {
    refreshInterval: 30_000,
  });

  const chart = data && typeof data.assignedChart === 'object' ? (data.assignedChart as WorkoutChartDTO | null) : null;

  return (
    <>
      <PageHeader
        title="My Workout Chart"
        description="Your personalised program from your trainer."
        breadcrumbs={[{ label: 'Dashboard', href: '/member' }, { label: 'My Workout Chart' }]}
        actions={
          <Button variant="ghost" size="sm" icon={<RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />} onClick={() => mutate()}>
            Refresh
          </Button>
        }
      />

      {isLoading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : chart ? (
        <ChartViewer chart={chart} />
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
            <h2 className="mt-6 text-2xl font-bold">No chart assigned yet</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Your trainer at {GYM.name} will create a workout chart tailored to your goal
              {data.fitnessGoal ? <> (<span className="text-white">{data.fitnessGoal.toLowerCase()}</span>)</> : null}. It will appear here automatically.
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}
