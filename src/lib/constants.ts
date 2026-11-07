import type { ChartCategory, MembershipCategory, Pricing } from '@/types';

export const GYM = {
  name: 'Power Zone Gym',
  shortName: 'Power Zone',
  tagline: 'Forge your strength. Own your zone.',
  address: '42 Iron Street, Colombo 03',
  phone: '+94 77 123 4567',
  email: 'hello@powerzonegym.com',
  hours: [
    { days: 'Mon – Fri', time: '5:00 AM – 10:00 PM' },
    { days: 'Saturday', time: '6:00 AM – 8:00 PM' },
    { days: 'Sunday', time: '7:00 AM – 1:00 PM' },
  ],
} as const;

/** Default monthly fees (Rs.). Admin can override these from Settings (stored in DB). */
export const MEMBERSHIP_PRICING = {
  normal: 3000, // Rs. 3,000
  cardio: 3000, // Rs. 3,000
  personal_training: 3000, // Rs. 3,000
} as const satisfies Pricing;

export const MEMBERSHIP_CATEGORIES: {
  value: MembershipCategory;
  label: string;
  short: string;
  emoji: string;
  description: string;
  features: string[];
  color: string;
}[] = [
  {
    value: 'normal',
    label: 'Normal Gym',
    short: 'Normal',
    emoji: '💪',
    description: 'Full access to the weights floor and free-weight zone.',
    features: ['Free weights & machines', 'Locker access', 'Workout chart from trainers'],
    color: '#00d4ff',
  },
  {
    value: 'cardio',
    label: 'Gym + Cardio',
    short: 'Cardio',
    emoji: '🏃',
    description: 'Everything in Normal plus the cardio deck.',
    features: ['All Normal benefits', 'Treadmills, bikes & rowers', 'Cardio programming'],
    color: '#00ff88',
  },
  {
    value: 'personal_training',
    label: 'Personal Training',
    short: 'Personal',
    emoji: '🎯',
    description: 'One-on-one coaching with a dedicated trainer.',
    features: ['All Cardio benefits', 'Dedicated personal trainer', 'Custom plans & check-ins'],
    color: '#ffaa00',
  },
];

export const CATEGORY_LABELS: Record<MembershipCategory, string> = {
  normal: 'Normal Gym',
  cardio: 'Gym + Cardio',
  personal_training: 'Personal Training',
};

export const CHART_CATEGORIES: { value: ChartCategory; label: string; color: string }[] = [
  { value: 'chest', label: 'Chest', color: '#00d4ff' },
  { value: 'back', label: 'Back', color: '#8b5cf6' },
  { value: 'legs', label: 'Legs', color: '#00ff88' },
  { value: 'shoulders', label: 'Shoulders', color: '#ffaa00' },
  { value: 'arms', label: 'Arms', color: '#ff6b35' },
  { value: 'abs', label: 'Abs', color: '#ff4fa3' },
  { value: 'cardio', label: 'Cardio', color: '#ff4444' },
  { value: 'full_body', label: 'Full Body', color: '#38bdf8' },
  { value: 'custom', label: 'Custom', color: '#a0a0b0' },
];

export const BODY_TYPES = ['Slim', 'Average', 'Athletic', 'Muscular', 'Overweight'] as const;

export const FITNESS_GOALS = [
  'Weight loss',
  'Muscle gain',
  'General fitness',
  'Strength',
  'Endurance',
  'Flexibility & mobility',
] as const;

export const MOTIVATIONAL_QUOTES = [
  'The only bad workout is the one that didn’t happen.',
  'Discipline is choosing what you want most over what you want now.',
  'Strength doesn’t come from what you can do. It comes from overcoming what you thought you couldn’t.',
  'Sweat is just fat crying.',
  'Your body can stand almost anything. It’s your mind you have to convince.',
  'Small progress is still progress.',
  'Don’t wish for it. Work for it.',
  'Push yourself, because no one else is going to do it for you.',
];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PAGE_SIZE = 10;

/** Max upload sizes for data-URL images stored in MongoDB. */
export const MAX_CHART_IMAGE_BYTES = 1.5 * 1024 * 1024;
export const MAX_PROFILE_IMAGE_BYTES = 300 * 1024;
