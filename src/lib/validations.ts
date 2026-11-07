import { z } from 'zod';

/**
 * Zod schemas shared by the client forms and API route handlers,
 * so validation rules live in exactly one place.
 */

const trimmed = (min: number, msg: string, max = 200) =>
  z.string().trim().min(min, msg).max(max, `Must be at most ${max} characters`);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{9,15}$/, 'Enter a valid phone number');

export const membershipCategorySchema = z.enum(['normal', 'cardio', 'personal_training']);

// ---------- Registration (multi-step) ----------

export const personalInfoSchema = z.object({
  name: trimmed(2, 'Name must be at least 2 characters', 80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
  phone: phoneSchema,
  address: trimmed(5, 'Enter your address', 200),
  age: z.coerce.number({ invalid_type_error: 'Enter your age' }).int().min(12, 'Minimum age is 12').max(100),
  gender: z.enum(['male', 'female'], { errorMap: () => ({ message: 'Select gender' }) }),
});

export const physicalDetailsSchema = z.object({
  weight: z.coerce.number({ invalid_type_error: 'Enter weight' }).min(20, 'Too low').max(400, 'Too high'),
  height: z.coerce.number({ invalid_type_error: 'Enter height' }).min(100, 'Too low').max(250, 'Too high'),
  bodyType: trimmed(2, 'Select a body type', 40),
  healthConditions: z.string().trim().max(500).optional().default(''),
  fitnessGoal: trimmed(2, 'Select a fitness goal', 60),
});

export const membershipSchema = z.object({
  membershipCategory: membershipCategorySchema,
});

export const registerSchema = personalInfoSchema.merge(physicalDetailsSchema).merge(membershipSchema);
export type RegisterInput = z.infer<typeof registerSchema>;

// The form keeps a confirm password field client-side only.
export const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type RegisterFormInput = z.infer<typeof registerFormSchema>;

// ---------- Login ----------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Member updates ----------

const imageDataUrl = z
  .string()
  .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, 'Invalid image')
  .or(z.literal(''));

/** Fields a member may update on their own profile. */
export const memberSelfUpdateSchema = z
  .object({
    phone: phoneSchema,
    address: trimmed(5, 'Enter your address', 200),
    weight: z.coerce.number().min(20).max(400),
    height: z.coerce.number().min(100).max(250),
    healthConditions: z.string().trim().max(500),
    fitnessGoal: trimmed(2, 'Select a fitness goal', 60),
    profileImage: imageDataUrl,
  })
  .partial();
export type MemberSelfUpdateInput = z.infer<typeof memberSelfUpdateSchema>;

/** Fields an admin may update on any member. */
export const adminMemberUpdateSchema = z
  .object({
    name: trimmed(2, 'Name must be at least 2 characters', 80),
    email: z.string().trim().toLowerCase().email(),
    phone: phoneSchema,
    address: trimmed(5, 'Enter an address', 200),
    age: z.coerce.number().int().min(12).max(100),
    gender: z.enum(['male', 'female']),
    weight: z.coerce.number().min(20).max(400),
    height: z.coerce.number().min(100).max(250),
    bodyType: trimmed(2, 'Select a body type', 40),
    healthConditions: z.string().trim().max(500),
    fitnessGoal: trimmed(2, 'Select a fitness goal', 60),
    membershipCategory: membershipCategorySchema,
    isActive: z.boolean(),
    profileImage: imageDataUrl,
    password: z.string().min(8).max(72),
  })
  .partial();
export type AdminMemberUpdateInput = z.infer<typeof adminMemberUpdateSchema>;

// ---------- Payments ----------

export const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const markCashSchema = monthYearSchema.extend({
  memberId: z.string().regex(/^[a-f\d]{24}$/i, 'Select a member'),
  amount: z.coerce.number({ invalid_type_error: 'Enter amount' }).positive('Amount must be positive').max(1_000_000),
});
export type MarkCashInput = z.infer<typeof markCashSchema>;

export const checkoutSchema = z.object({
  paymentId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

// ---------- Workout plans (per member) ----------

export const planExerciseSchema = z.object({
  name: trimmed(1, 'Exercise name is required', 120),
  setsReps: z.string().trim().max(60, 'Too long').optional().default(''),
  notes: z.string().trim().max(200).optional().default(''),
});

export const planDaySchema = z.object({
  dayNumber: z.coerce.number().int().min(1).max(14),
  dayTitle: z.string().trim().max(80).optional().default(''),
  exercises: z.array(planExerciseSchema).min(1, 'Add at least one exercise to every day').max(40),
});

export const workoutPlanSchema = z.object({
  gymName: trimmed(2, 'Gym name is required', 80),
  planTitle: trimmed(3, 'Plan title must be at least 3 characters', 120),
  startDate: z.coerce.date({ invalid_type_error: 'Pick a start date' }),
  notes: z.string().trim().max(1000).optional().default(''),
  days: z.array(planDaySchema).min(1, 'Add at least one day').max(14, 'Maximum 14 days'),
});
export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>;
export type WorkoutPlanFormInput = z.input<typeof workoutPlanSchema>;

// ---------- Attendance ----------

export const markAttendanceSchema = z.object({
  memberId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

// ---------- Settings ----------

export const settingsSchema = z.object({
  pricing: z.object({
    normal: z.coerce.number().min(0).max(1_000_000),
    cardio: z.coerce.number().min(0).max(1_000_000),
    personal_training: z.coerce.number().min(0).max(1_000_000),
  }),
  applyToPending: z.boolean().optional().default(true),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
