/**
 * Shared TypeScript types used by both the API layer and the client.
 * API responses are JSON, so ObjectIds and Dates arrive as strings on the client.
 */

export type Role = 'member' | 'admin';
export type Gender = 'male' | 'female';
export type MembershipCategory = 'normal' | 'cardio' | 'personal_training';
export type PaymentMethod = 'online' | 'cash';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type ChartCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'abs'
  | 'cardio'
  | 'full_body'
  | 'custom';

export type Pricing = Record<MembershipCategory, number>;

/** Standard API envelope. */
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

export interface WeightEntry {
  weight: number;
  date: string;
}

export interface Exercise {
  _id?: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  notes?: string;
  imageUrl?: string;
}

export interface WorkoutChartDTO {
  _id: string;
  title: string;
  category: ChartCategory;
  description?: string;
  exercises: Exercise[];
  chartImage?: string;
  createdBy?: { _id: string; name: string } | string;
  assignedTo: (MemberSummary | string)[];
  createdAt: string;
  updatedAt: string;
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
  assignedChart?: WorkoutChartDTO | string | null;
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
  assignedChart: WorkoutChartDTO | null;
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
