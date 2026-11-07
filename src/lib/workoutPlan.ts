/**
 * Helpers for personalised workout plans.
 * Pure functions — safe to use on both client and server.
 */
import type { PlanDay, PlanExercise } from '@/types';

/** Day headings trainers use: "1 day", "Day 2", "3rd day - Legs", "DAY 4: Back & Biceps". */
const DAY_HEADING = /^(?:day\s*(\d{1,2})|(\d{1,2})\s*(?:st|nd|rd|th)?\s*day)\b\s*[:\-–—.)]?\s*(.*)$/i;

/**
 * Muscle-group label lines inside a day: "Biceps:", "-- Triceps --", "== Back ==", "[Chest]".
 * Must contain no digits so "Plank 30 sec:" isn't mistaken for a label.
 */
const GROUP_LABEL = /^(?:[-=]{2,}\s*([^\d]{2,40}?)\s*[-=]{2,}|\[\s*([^\d\]]{2,40})\s*\]|([^\d:]{2,40}):)$/;

/** WhatsApp "copy message" / chat-export prefixes: "[18:30, 06/11/2026] Sachin Gym: " or "06/11/2026, 18:30 - Sachin Gym: " */
const WHATSAPP_PREFIX = /^\s*(?:\[[^\]]{4,40}\]\s*[^:]{1,40}:\s*|\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?:\s?[ap]m)?\s+-\s+[^:]{1,40}:\s*)/i;

/** Strip WhatsApp bold/italic markers and bullet characters. */
function clean(line: string) {
  return line
    .replace(WHATSAPP_PREFIX, '')
    .replace(/[*_~]/g, '') // WhatsApp bold / italic / strikethrough
    .replace(/^\s*(?:[-•▪●◦>]|\d{1,2}[.)])\s+/, '') // bullets / "1." numbering
    .replace(/\s+/g, ' ')
    .trim();
}

function balance(name: string) {
  const open = (name.match(/\(/g) ?? []).length;
  const close = (name.match(/\)/g) ?? []).length;
  return open - close;
}

export const isDivider = (e: Pick<PlanExercise, 'isGroupDivider'>) => Boolean(e.isGroupDivider);

export function divider(groupTitle = ''): PlanExercise {
  return { name: '', setsReps: '', notes: '', isGroupDivider: true, groupTitle };
}

/**
 * Tidy divider rows: no divider before the first exercise or after the last one,
 * and consecutive dividers collapse into one (keeping a label if any has one).
 */
export function normalizeExercises<T extends Pick<PlanExercise, 'isGroupDivider' | 'groupTitle'>>(rows: T[]): T[] {
  const out: T[] = [];
  for (const row of rows) {
    if (!row.isGroupDivider) {
      out.push(row);
      continue;
    }
    if (out.length === 0) {
      // Leading divider with a label is still useful as the first group's heading.
      if (row.groupTitle?.trim()) out.push(row);
      continue;
    }
    const last = out[out.length - 1];
    if (last.isGroupDivider) {
      if (!last.groupTitle?.trim() && row.groupTitle?.trim()) out[out.length - 1] = row;
      continue;
    }
    out.push(row);
  }
  while (out.length && out[out.length - 1].isGroupDivider) out.pop();
  return out;
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
 *  - "1 day" / "Day 2 - Legs" start a new day (lines before the first heading go into Day 1)
 *  - a blank line between exercises becomes a divider (muscle-group gap)
 *  - "Biceps:" / "-- Triceps --" / "[Back]" become a labelled divider
 */
export function parseWhatsAppPlan(text: string): PlanDay[] {
  const days: PlanDay[] = [];
  let current: PlanDay | null = null;
  let pendingGap = false;

  const ensureDay = () => {
    if (!current) {
      current = { dayNumber: 1, dayTitle: '', exercises: [] };
      days.push(current);
    }
    return current;
  };

  const rawLines = text.split(/\r?\n/);
  // If the text has day headings, anything before the first one is a header
  // (gym name, plan title, "Member: …") — e.g. when re-importing a message this app sent.
  const firstHeading = rawLines.findIndex((l) => DAY_HEADING.test(clean(l)));

  for (const [i, raw] of rawLines.entries()) {
    if (firstHeading > 0 && i < firstHeading) continue;
    const unprefixed = raw.replace(WHATSAPP_PREFIX, '').trim();
    if (/^(📝|member:)/i.test(unprefixed)) continue; // footer notes / member line from formatPlanForWhatsApp

    const line = clean(raw);
    if (!line) {
      pendingGap = true;
      continue;
    }

    // "_Biceps_" — an italic label line, as written by formatPlanForWhatsApp.
    const italic = /^_([^_\d]{2,40})_$/.exec(unprefixed);
    if (italic) {
      ensureDay().exercises.push(divider(italic[1].trim()));
      pendingGap = false;
      continue;
    }

    const heading = DAY_HEADING.exec(line);
    if (heading) {
      const num = Number(heading[1] ?? heading[2]);
      current = { dayNumber: num || days.length + 1, dayTitle: (heading[3] ?? '').trim(), exercises: [] };
      days.push(current);
      pendingGap = false;
      continue;
    }

    const label = GROUP_LABEL.exec(line);
    if (label) {
      ensureDay().exercises.push(divider((label[1] ?? label[2] ?? label[3] ?? '').trim()));
      pendingGap = false;
      continue;
    }

    const exercise = parseExerciseLine(line);
    if (!exercise) continue;
    const day = ensureDay();
    if (pendingGap && day.exercises.length > 0) day.exercises.push(divider());
    pendingGap = false;
    day.exercises.push(exercise);
  }

  // Renumber sequentially, tidy dividers, and drop days without exercises.
  return days
    .map((d) => ({ ...d, exercises: normalizeExercises(d.exercises) }))
    .filter((d) => d.exercises.some((e) => !isDivider(e)))
    .map((d, i) => ({ ...d, dayNumber: i + 1 }));
}

/** Format a plan as a WhatsApp message (uses *bold* / _italic_ markup). */
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
      if (isDivider(ex)) {
        lines.push('');
        if (ex.groupTitle) lines.push(`_${ex.groupTitle}_`);
        continue;
      }
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

/** Exercises only (dividers excluded). */
export function realExercises<T extends Pick<PlanExercise, 'isGroupDivider'>>(rows: T[]): T[] {
  return rows.filter((r) => !r.isGroupDivider);
}

/**
 * Split a day's rows into muscle groups for rendering:
 * [{ title, exercises: [{ exercise, number }] }] — numbering runs continuously across groups.
 */
export function groupExercises(rows: PlanExercise[]) {
  const groups: { title: string; items: { exercise: PlanExercise; number: number }[] }[] = [];
  let n = 0;
  for (const row of rows) {
    if (isDivider(row)) {
      groups.push({ title: row.groupTitle ?? '', items: [] });
      continue;
    }
    if (groups.length === 0) groups.push({ title: '', items: [] });
    groups[groups.length - 1].items.push({ exercise: row, number: ++n });
  }
  return groups.filter((g) => g.items.length > 0);
}

export function planStats(days: PlanDay[]) {
  return {
    dayCount: days.length,
    exerciseCount: days.reduce((n, d) => n + realExercises(d.exercises).length, 0),
  };
}
