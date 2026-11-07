/**
 * Shared TypeScript types used by both the API layer and the client.
 * API responses are JSON, so ObjectIds and Dates arrive as strings on the client.
 */

export type Role = 'member' | 'admin';
export type Gender = 'male' | 'female';
export type MembershipCategory = 'normal' | 'cardio' | 'personal_training';
export type PaymentMethod = 'online' | 'cash';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type Pricing = Record<MembershipCategory, number>;

/** Standard API envelope. */
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

export interface WeightEntry {
  weight: number;
  date: string;
}

/** One exercise line, e.g. "Incline flies — 12 10 8". */
export interface PlanExercise {
  _id?: string;
  name: string;
  /** Free-form: "12 10 8", "4 x 12", "10-3", "Till failure". */
  setsReps: string;
  notes?: string;
}

export interface PlanDay {
  _id?: string;
  dayNumber: number;
  dayTitle: string;
  exercises: PlanExercise[];
}

/** A member's personalised multi-day routine (one per member). */
export interface WorkoutPlanDTO {
  _id: string;
  member: MemberSummary | string;
  gymName: string;
  planTitle: string;
  startDate: string;
  notes?: string;
  days: PlanDay[];
  updatedBy?: { _id: string; name: string } | string;
  createdAt: string;
  updatedAt: string;
}

/** Row in the admin workout-plans overview. */
export interface MemberPlanListItem {
  member: MemberSummary & { fitnessGoal?: string };
  plan: { _id: string; planTitle: string; dayCount: number; exerciseCount: number; dayTitles: string[]; updatedAt: string } | null;
}

export interface MemberSummary {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  membershipCategory: MembershipCategory;
  profileImage?: string;
  isActive?: boolean;
}

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  age: number;
  gender: Gender;
  profileImage?: string;
  weight: number;
  height: number;
  bodyType: string;
  healthConditions?: string;
  fitnessGoal: string;
  membershipCategory: MembershipCategory;
  registeredDate: string;
  role: Role;
  isActive: boolean;
  weightHistory: WeightEntry[];
  createdAt: string;
  updatedAt: string;
}

/** Member row in the admin members table (includes current-month payment status). */
export interface MemberListItem extends UserDTO {
  currentPayment: { status: PaymentStatus; amount: number; _id: string } | null;
}

export interface PaymentDTO {
  _id: string;
  member: MemberSummary | string;
  amount: number;
  month: number;
  year: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  stripePaymentId?: string;
  stripeSessionId?: string;
  markedBy?: { _id: string; name: string } | string;
  markedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceDTO {
  _id: string;
  member: MemberSummary | string;
  date: string;
  checkInTime: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  counts: { paid: number; pending: number; overdue: number; total: number };
  byMethod: { online: number; cash: number };
  byCategory: Record<MembershipCategory, { expected: number; collected: number; count: number }>;
}

export type ActivityType = 'registration' | 'payment' | 'attendance';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  at: string;
}

export interface AdminStats {
  activeMembers: number;
  totalMembers: number;
  revenueThisMonth: number;
  pendingThisMonth: { count: number; amount: number };
  todayAttendance: number;
  revenueTrend: { label: string; revenue: number; payments: number }[];
  categoryBreakdown: { category: MembershipCategory; count: number }[];
  recentActivity: ActivityItem[];
}

export interface MemberStats {
  name: string;
  daysThisMonth: number;
  checkedInToday: boolean;
  checkInTime: string | null;
  streak: number;
  currentPayment: PaymentDTO | null;
  membershipCategory: MembershipCategory;
  monthlyFee: number;
  memberSince: string;
  workoutPlan: WorkoutPlanDTO | null;
}

export interface AttendanceOverview {
  date: string;
  today: AttendanceDTO[];
  month: number;
  year: number;
  daily: { date: string; count: number }[];
  topMembers: { member: MemberSummary; count: number }[];
  averageDaily: number;
  totalThisMonth: number;
}

export interface MemberAttendance {
  records: AttendanceDTO[];
  month: number | null;
  year: number | null;
  totalInPeriod: number;
  totalAllTime: number;
  streak: number;
  longestStreak: number;
}

export interface SettingsDTO {
  pricing: Pricing;
  updatedAt?: string;
}
