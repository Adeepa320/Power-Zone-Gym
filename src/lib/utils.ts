import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isValid, parseISO, startOfDay, subDays, isSameDay } from 'date-fns';
import { CATEGORY_LABELS, MONTHS } from './constants';
import type { MembershipCategory } from '@/types';

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Sri Lankan / South Asian style rupees: Rs. 3,000 */
export function formatCurrency(amount: number) {
  return `Rs. ${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatCompact(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return String(amount);
}

function toDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null;
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date | undefined | null, pattern = 'dd MMM yyyy') {
  const d = toDate(value);
  return d ? format(d, pattern) : '—';
}

export function formatTime(value: string | Date | undefined | null) {
  const d = toDate(value);
  return d ? format(d, 'hh:mm a') : '—';
}

export function monthName(month: number, short = false) {
  const name = MONTHS[month - 1] ?? '';
  return short ? name.slice(0, 3) : name;
}

export function monthLabel(month: number, year: number) {
  return `${monthName(month)} ${year}`;
}

export function categoryLabel(category: MembershipCategory) {
  return CATEGORY_LABELS[category] ?? category;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Deterministic gradient for an avatar based on the name. */
export function avatarGradient(seed: string) {
  const palettes = [
    ['#00d4ff', '#8b5cf6'],
    ['#00ff88', '#00d4ff'],
    ['#ffaa00', '#ff6b35'],
    ['#8b5cf6', '#ff4fa3'],
    ['#ff6b35', '#ff4444'],
    ['#38bdf8', '#00ff88'],
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const [a, b] = palettes[Math.abs(hash) % palettes.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function bmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return null;
  const value = weightKg / Math.pow(heightCm / 100, 2);
  let label = 'Normal';
  if (value < 18.5) label = 'Underweight';
  else if (value >= 25 && value < 30) label = 'Overweight';
  else if (value >= 30) label = 'Obese';
  return { value: Math.round(value * 10) / 10, label };
}

/**
 * Compute the current consecutive-day streak from a list of attendance dates.
 * A streak is still "alive" if the latest check-in was today or yesterday.
 */
export function computeStreaks(dates: (string | Date)[]) {
  const days = Array.from(
    new Set(
      dates
        .map((d) => toDate(d))
        .filter((d): d is Date => !!d)
        .map((d) => startOfDay(d).getTime()),
    ),
  ).sort((a, b) => b - a);

  if (days.length === 0) return { current: 0, longest: 0 };

  // Longest streak
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const expected = subDays(new Date(days[i - 1]), 1).getTime();
    if (days[i] === expected) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak
  const today = startOfDay(new Date());
  const latest = new Date(days[0]);
  let current = 0;
  if (isSameDay(latest, today) || isSameDay(latest, subDays(today, 1))) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      const expected = subDays(new Date(days[i - 1]), 1).getTime();
      if (days[i] === expected) current++;
      else break;
    }
  }
  return { current, longest };
}

/** Client-side: read an image file and downscale it to a JPEG data URL. */
export function fileToDataUrl(file: File, maxSize = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Approximate byte size of a base64 data URL. */
export function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function currentMonthYear(date = new Date()) {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}
