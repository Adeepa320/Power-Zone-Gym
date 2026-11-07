'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckCircle2, Fingerprint } from 'lucide-react';
import { apiRequest } from '@/hooks/useFetch';
import { SuccessBurst } from '@/components/ui/SuccessBurst';
import { formatTime } from '@/lib/utils';

/** Large animated "Mark Attendance" button with success burst. */
export function CheckInButton({
  checkedIn,
  checkInTime,
  disabled,
  onCheckedIn,
}: {
  checkedIn: boolean;
  checkInTime: string | null;
  disabled?: boolean;
  onCheckedIn: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  async function handle() {
    if (checkedIn || loading || disabled) return;
    setLoading(true);
    try {
      await apiRequest('/api/attendance', 'POST', {});
      setCelebrate(true);
      toast.success('Checked in — have a great workout! 💪');
      window.setTimeout(() => setCelebrate(false), 2400);
      onCheckedIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed');
      onCheckedIn();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <SuccessBurst size={120} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Pulsing rings when ready */}
        {!checkedIn &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
            />
          ))}
        <motion.button
          onClick={handle}
          disabled={checkedIn || loading || disabled}
          whileHover={!checkedIn ? { scale: 1.05 } : undefined}
          whileTap={!checkedIn ? { scale: 0.94 } : undefined}
          animate={celebrate ? { scale: [1, 0.9, 1.08, 1] } : undefined}
          className={`relative flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full border-4 font-display font-bold transition-colors sm:h-52 sm:w-52 ${
            checkedIn
              ? 'cursor-default border-success/40 bg-gradient-to-br from-success/25 to-success/5 text-success shadow-glow-success'
              : 'border-primary/40 bg-gradient-to-br from-primary/30 via-violet/20 to-transparent text-white shadow-glow-lg'
          } disabled:opacity-100`}
        >
          {loading ? (
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="h-12 w-12 rounded-full border-4 border-white/20 border-t-primary" />
          ) : checkedIn ? (
            <>
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
                <CheckCircle2 className="h-14 w-14" />
              </motion.span>
              <span className="text-sm">Checked In</span>
            </>
          ) : (
            <>
              <Fingerprint className="h-14 w-14 text-primary" />
              <span className="text-base">Mark Attendance</span>
            </>
          )}
        </motion.button>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {checkedIn ? (
          <>
            Already checked in today ✅ <span className="text-white">at {formatTime(checkInTime)}</span>
          </>
        ) : disabled ? (
          'Your membership is inactive — please contact the front desk.'
        ) : (
          'Tap when you arrive at the gym'
        )}
      </p>
    </div>
  );
}

export default CheckInButton;
