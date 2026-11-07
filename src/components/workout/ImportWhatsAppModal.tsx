'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardPaste, MessageCircle, Wand2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { parseWhatsAppPlan } from '@/lib/workoutPlan';
import { cn } from '@/lib/utils';
import type { PlanDay } from '@/types';
import { dayColor } from './PlanViewer';

const EXAMPLE = `1 day
Incline flyes 12 10 8
Incline press (m) 12 10 8
Bench press 12 10 8
Cable flyes 10-3
Z bar curl 10-2 8-2
Hammer curl 10-2 8-2

2 day
B/b upright row 12 10 8
D/b shrugs 12-2 10-2
Face pull 10-3
Back side lateral 12-3 (D/b side lateral 10-3)`;

/**
 * Paste a routine exactly as sent on WhatsApp and turn it into structured days.
 * Understands "1 day" / "Day 2 - Legs" headings, "12 10 8" / "10-3" / "4 x 12" sets,
 * and WhatsApp copy prefixes like "[18:30, 06/11/2026] Sachin Gym:".
 */
export function ImportWhatsAppModal({
  open,
  onClose,
  hasExistingDays,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  hasExistingDays: boolean;
  onImport: (days: PlanDay[], mode: 'replace' | 'append') => void;
}) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const parsed = useMemo(() => parseWhatsAppPlan(text), [text]);
  const exerciseCount = parsed.reduce((n, d) => n + d.exercises.length, 0);

  async function paste() {
    try {
      setText(await navigator.clipboard.readText());
    } catch {
      /* clipboard permission denied — user can paste manually */
    }
  }

  function confirm() {
    onImport(parsed, hasExistingDays ? mode : 'replace');
    setText('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-success" /> Import from WhatsApp
        </span>
      }
      description="Paste the routine exactly as you'd send it on WhatsApp — days and sets are detected automatically."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" icon={<Wand2 className="h-4 w-4" />} disabled={parsed.length === 0} onClick={confirm}>
            Import {parsed.length} day{parsed.length === 1 ? '' : 's'} · {exerciseCount} exercises
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">WhatsApp text</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setText(EXAMPLE)} className="text-xs text-muted hover:text-white">
                Use example
              </button>
              <button type="button" onClick={paste} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <ClipboardPaste className="h-3.5 w-3.5" /> Paste
              </button>
            </div>
          </div>
          <Textarea rows={16} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} className="font-mono text-[13px] leading-relaxed" autoFocus />
          {hasExistingDays && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  ['replace', 'Replace current days'],
                  ['append', 'Add after current days'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm transition',
                    mode === value ? 'border-primary/60 bg-primary/10 text-primary' : 'border-white/10 text-muted hover:border-white/25',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">Preview</span>
          <div className="scrollbar-thin max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
            {parsed.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted">Paste a routine to see how it will be imported.</p>
            ) : (
              parsed.map((d, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                  <p className="mb-2 text-xs font-bold" style={{ color: dayColor(i) }}>
                    DAY {d.dayNumber}
                    {d.dayTitle && <span className="ml-2 font-semibold text-white">{d.dayTitle}</span>}
                  </p>
                  <ul className="space-y-1 text-sm">
                    {d.exercises.map((ex, j) => (
                      <li key={j} className="flex items-baseline justify-between gap-3">
                        <span className="truncate">
                          {ex.name}
                          {ex.notes && <span className="ml-1 text-xs text-muted">({ex.notes})</span>}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-primary">{ex.setsReps || '—'}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))
            )}
          </div>
          <p className="mt-2 text-xs text-muted">Tip: day titles like &quot;Chest &amp; Biceps&quot; can be added after importing.</p>
        </div>
      </div>
    </Modal>
  );
}

export default ImportWhatsAppModal;
