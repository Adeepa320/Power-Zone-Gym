/**
 * Helpers for personalised workout plans.
 * Pure functions — safe to use on both client and server.
 */
import type { PlanDay, PlanExercise } from '@/types';

/** Day headings trainers use: "1 day", "Day 2", "3rd day - Legs", "DAY 4: Back & Biceps". */
const DAY_HEADING = /^(?:day\s*(\d{1,2})|(\d{1,2})\s*(?:st|nd|rd|th)?\s*day)\b\s*[:\-–—.)]?\s*(.*)$/i;

/** WhatsApp "copy message" / chat-export prefixes: "[18:30, 06/11/2026] Sachin Gym: " or "06/11/2026, 18:30 - Sachin Gym: " */
const WHATSAPP_PREFIX = /^\s*(?:\[[^\]]{4,40}\]\s*[^:]{1,40}:\s*|\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?:\s?[ap]m)?\s+-\s+[^:]{1,40}:\s*)/i;

/** Strip WhatsApp bold/italic markers and bullet characters. */
function clean(line: string) {
  return line
    .replace(WHATSAPP_PREFIX, '')
    .replace(/[*_~]/g, '')
    .replace(/^\s*(?:[-•▪●◦>]|\d{1,2}[.)])\s+/, '') // bullets / "1." numbering
    .replace(/\s+/g, ' ')
    .trim();
}

function balance(name: string) {
  const open = (name.match(/\(/g) ?? []).length;
  const close = (name.match(/\)/g) ?? []).length;
  return open - close;
}

/**
 * Split one exercise line into name / sets-reps / notes.
 *   "Incline falis 12 10 8"                   → name "Incline falis", setsReps "12 10 8"
 *   "Inclin (D/b press 10 8 8)"               → name "Inclin (D/b press)", setsReps "10 8 8"
 *   "Back side letter 12-3 (D/b side letter 10-3)" → setsReps "12-3", notes "D/b side letter 10-3"
 *   "Plank till failure"                      → setsReps "till failure"
 */
export function parseExerciseLine(raw: string): PlanExercise | null {
  const line = clean(raw);
  if (!line) return null;

  const tokens = line.split(' ');
  // First token that starts the sets/reps part: a number (12, 10-3, 4x12) or "till/to failure".
  let idx = tokens.findIndex((t, i) => i > 0 && /^\d/.test(t));
  const failureIdx = tokens.findIndex((t, i) => i > 0 && /^(till|to|until)$/i.test(t) && /^fail/i.test(tokens[i + 1] ?? ''));
  if (idx === -1 || (failureIdx !== -1 && failureIdx < idx)) idx = failureIdx;

  if (idx === -1) return { name: line, setsReps: '', notes: '' };

  let name = tokens.slice(0, idx).join(' ');
  let rest = tokens.slice(idx).join(' ');
  let notes = '';

  // Unclosed "(" in the name → the closing ")" ended up after the numbers.
  if (balance(name) > 0 && rest.endsWith(')')) {
    rest = rest.slice(0, -1).trim();
    name = `${name})`;
  }
  // "12-3 (D/b side letter 10-3)" → notes in brackets after the sets/reps.
  const paren = rest.indexOf('(');
  if (paren > 0) {
    notes = rest.slice(paren).replace(/^\(|\)$/g, '').trim();
    rest = rest.slice(0, paren).trim();
  }
  return { name: name.trim(), setsReps: rest.trim(), notes };
}

/**
 * Parse a WhatsApp-style routine into days.
 * Lines before the first "N day" heading go into Day 1.
 */
export function parseWhatsAppPlan(text: string): PlanDay[] {
  const days: PlanDay[] = [];
  let current: PlanDay | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = clean(raw);
    if (!line) continue;

    const heading = DAY_HEADING.exec(line);
    if (heading) {
      const num = Number(heading[1] ?? heading[2]);
      current = { dayNumber: num || days.length + 1, dayTitle: (heading[3] ?? '').trim(), exercises: [] };
      days.push(current);
      continue;
    }

    const exercise = parseExerciseLine(line);
    if (!exercise) continue;
    if (!current) {
      current = { dayNumber: 1, dayTitle: '', exercises: [] };
      days.push(current);
    }
    current.exercises.push(exercise);
  }

  // Renumber sequentially (handles duplicate/missing numbers) and drop empty days.
  return days.filter((d) => d.exercises.length > 0).map((d, i) => ({ ...d, dayNumber: i + 1 }));
}

/** Format a plan as a WhatsApp message (uses *bold* markup). */
export function formatPlanForWhatsApp(plan: {
  gymName: string;
  planTitle: string;
  memberName?: string;
  notes?: string;
  days: PlanDay[];
}) {
  const lines: string[] = [`*${plan.gymName}*`, `_${plan.planTitle}_`];
  if (plan.memberName) lines.push(`Member: ${plan.memberName}`);
  for (const day of plan.days) {
    lines.push('', `*${day.dayNumber} day${day.dayTitle ? ` – ${day.dayTitle}` : ''}*`);
    for (const ex of day.exercises) {
      let line = ex.name;
      if (ex.setsReps) line += ` ${ex.setsReps}`;
      if (ex.notes) line += ` (${ex.notes})`;
      lines.push(line);
    }
  }
  if (plan.notes) lines.push('', `📝 ${plan.notes}`);
  return lines.join('\n');
}

/** wa.me link for a phone number like "+94 77 123 4567". */
export function whatsappLink(phone: string | undefined, text: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function planStats(days: PlanDay[]) {
  return {
    dayCount: days.length,
    exerciseCount: days.reduce((n, d) => n + d.exercises.length, 0),
  };
}
