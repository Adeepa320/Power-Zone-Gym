import { endOfMonth, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { connectDB } from '@/lib/db';
import { ApiError, handleError, ok, requireAuth } from '@/lib/api';
import { ensureMemberCurrentPayment, ensureMonthlyPayments } from '@/lib/payments';
import { getPricing } from '@/lib/settings';
import { categoryLabel, computeStreaks, currentMonthYear, formatCurrency, monthLabel, monthName } from '@/lib/utils';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Attendance from '@/models/Attendance';
import MemberWorkoutPlan from '@/models/MemberWorkoutPlan';
import type { ActivityItem, AdminStats, MembershipCategory } from '@/types';

export const dynamic = 'force-dynamic';

type PopulatedName = { name?: string } | null;

/** GET /api/dashboard/stats — admin overview or member summary depending on role. */
export async function GET() {
  try {
    const session = await requireAuth();
    await connectDB();
    return session.user.role === 'admin' ? ok(await adminStats()) : ok(await memberStats(session.user.id));
  } catch (error) {
    return handleError(error);
  }
}

async function adminStats(): Promise<AdminStats> {
  await ensureMonthlyPayments();
  const { month, year } = currentMonthYear();
  const today = startOfDay(new Date());

  // Last 6 months, oldest first
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(year, month - 1, 1), 5 - i);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const [
    activeMembers,
    totalMembers,
    thisMonth,
    todayAttendance,
    trendRows,
    categoryRows,
    recentUsers,
    recentPayments,
    recentAttendance,
  ] = await Promise.all([
    User.countDocuments({ role: 'member', isActive: true }),
    User.countDocuments({ role: 'member' }),
    Payment.aggregate<{ _id: string; amount: number; count: number }>([
      { $match: { month, year } },
      { $group: { _id: '$paymentStatus', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Attendance.countDocuments({ date: today }),
    Payment.aggregate<{ _id: { month: number; year: number }; revenue: number; count: number }>([
      {
        $match: {
          paymentStatus: 'paid',
          $or: months.map((m) => ({ month: m.month, year: m.year })),
        },
      },
      { $group: { _id: { month: '$month', year: '$year' }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    User.aggregate<{ _id: MembershipCategory; count: number }>([
      { $match: { role: 'member', isActive: true } },
      { $group: { _id: '$membershipCategory', count: { $sum: 1 } } },
    ]),
    User.find({ role: 'member' }).sort({ createdAt: -1 }).limit(6).select('name membershipCategory createdAt').lean(),
    Payment.find({ paymentStatus: 'paid' })
      .sort({ paidAt: -1 })
      .limit(6)
      .populate('member', 'name')
      .select('member amount paymentMethod month year paidAt')
      .lean(),
    Attendance.find().sort({ checkInTime: -1 }).limit(6).populate('member', 'name').lean(),
  ]);

  const paid = thisMonth.find((r) => r._id === 'paid');
  const pending = thisMonth.find((r) => r._id === 'pending');

  const revenueTrend = months.map((m) => {
    const row = trendRows.find((r) => r._id.month === m.month && r._id.year === m.year);
    return { label: `${monthName(m.month, true)} ${String(m.year).slice(2)}`, revenue: row?.revenue ?? 0, payments: row?.count ?? 0 };
  });

  const activity: ActivityItem[] = [
    ...recentUsers.map((u) => ({
      id: `u-${u._id}`,
      type: 'registration' as const,
      title: `${u.name} joined`,
      description: categoryLabel(u.membershipCategory),
      at: u.createdAt.toISOString(),
    })),
    ...recentPayments
      .filter((p) => p.paidAt)
      .map((p) => ({
        id: `p-${p._id}`,
        type: 'payment' as const,
        title: `${(p.member as PopulatedName)?.name ?? 'Member'} paid ${formatCurrency(p.amount)}`,
        description: `${monthLabel(p.month, p.year)} · ${p.paymentMethod === 'cash' ? 'Cash' : 'Online'}`,
        at: p.paidAt!.toISOString(),
      })),
    ...recentAttendance.map((a) => ({
      id: `a-${a._id}`,
      type: 'attendance' as const,
      title: `${(a.member as PopulatedName)?.name ?? 'Member'} checked in`,
      description: 'Attendance marked',
      at: a.checkInTime.toISOString(),
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  const categories: MembershipCategory[] = ['normal', 'cardio', 'personal_training'];
  return {
    activeMembers,
    totalMembers,
    revenueThisMonth: paid?.amount ?? 0,
    pendingThisMonth: { count: pending?.count ?? 0, amount: pending?.amount ?? 0 },
    todayAttendance,
    revenueTrend,
    categoryBreakdown: categories.map((c) => ({ category: c, count: categoryRows.find((r) => r._id === c)?.count ?? 0 })),
    recentActivity: activity,
  };
}

async function memberStats(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError('Member not found', 404);

  const { month, year } = currentMonthYear();
  if (user.isActive) await ensureMemberCurrentPayment(userId, user.membershipCategory);

  const monthStart = startOfMonth(new Date());
  const [daysThisMonth, todayRecord, allDates, currentPayment, pricing, workoutPlan] = await Promise.all([
    Attendance.countDocuments({ member: userId, date: { $gte: monthStart, $lte: endOfMonth(monthStart) } }),
    Attendance.findOne({ member: userId, date: startOfDay(new Date()) }).lean(),
    Attendance.find({ member: userId }).select('date').sort({ date: -1 }).limit(400).lean(),
    Payment.findOne({ member: userId, month, year }).lean(),
    getPricing(),
    MemberWorkoutPlan.findOne({ member: userId }).lean(),
  ]);

  return {
    name: user.name,
    daysThisMonth,
    checkedInToday: Boolean(todayRecord),
    checkInTime: todayRecord?.checkInTime ?? null,
    streak: computeStreaks(allDates.map((a) => a.date)).current,
    currentPayment,
    membershipCategory: user.membershipCategory,
    monthlyFee: currentPayment?.amount ?? pricing[user.membershipCategory],
    memberSince: user.registeredDate,
    workoutPlan: workoutPlan ?? null,
  };
}
