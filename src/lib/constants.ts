import type { MembershipCategory, Pricing } from '@/types';

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

/** Max upload size for data-URL profile images stored in MongoDB. */
export const MAX_PROFILE_IMAGE_BYTES = 300 * 1024;

/** Autocomplete suggestions in the workout plan editor (trainers can type anything). */
export const DAY_TITLE_SUGGESTIONS = [
  'Chest & Biceps',
  'Back & Triceps',
  'Shoulders & Traps',
  'Legs & Core',
  'Back & Biceps',
  'Chest & Triceps',
  'Shoulders & Arms',
  'Legs',
  'Full Body',
  'Cardio & Abs',
  'Push',
  'Pull',
] as const;

export const COMMON_EXERCISES = [
  'Bench Press',
  'Bench Press (Machine)',
  'Incline Bench Press',
  'Incline Dumbbell Press',
  'Decline Bench Press',
  'Incline Flyes',
  'Cable Flyes',
  'Pec Deck Fly',
  'Cable Crossover',
  'Push-ups',
  'Dips',
  'Pull-ups',
  'Lat Pulldown',
  'Seated Cable Row',
  'Bent Over Row',
  'One Arm Dumbbell Row',
  'T-Bar Row',
  'Deadlift',
  'Romanian Deadlift',
  'Barbell Upright Row',
  'Dumbbell Shrugs',
  'Face Pull',
  'Overhead Press',
  'Dumbbell Shoulder Press',
  'Dumbbell Front Raise',
  'Dumbbell Lateral Raise',
  'Cable Lateral Raise',
  'Rear Delt Fly',
  'Barbell Curl',
  'EZ Bar Curl',
  'Dumbbell Curl',
  'Hammer Curl',
  'Cable Curl',
  'Preacher Curl',
  'Concentration Curl',
  'Triceps Pushdown',
  'Overhead Triceps Extension',
  'Skull Crushers',
  'Close Grip Bench Press',
  'Squat',
  'Leg Press',
  'Hack Squat',
  'Walking Lunges',
  'Leg Extension',
  'Leg Curl',
  'Standing Calf Raise',
  'Seated Calf Raise',
  'Plank',
  'Crunches',
  'Hanging Leg Raise',
  'Russian Twist',
  'Treadmill',
  'Cycling',
  'Rowing Machine',
] as const;
