import { endOfDay, endOfMonth, format, getDaysInMonth, isAfter, startOfDay, startOfMonth } from 'date-fns';
import { connectDB } from '@/lib/db';
import { ApiError, handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { markAttendanceSchema, monthYearSchema } from '@/lib/validations';
import { currentMonthYear } from '@/lib/utils';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import type { AttendanceOverview, MemberSummary } from '@/types';

export const dynamic = 'force-dynamic';

const MEMBER_FIELDS = 'name email phone membershipCategory profileImage';

/**
 * GET /api/attendance  (admin)
 * Query: date=yyyy-MM-dd (default today), month, year (default current)
 * Returns the day's check-ins plus monthly statistics (heatmap, top members, average).
 */
export async function GET(req: Request) {
  try {
    await requireAuth('admin');
    await connectDB();
    const { searchParams } = new URL(req.url);

    const dateParam = searchParams.get('date');
    const day = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
    if (Number.isNaN(day.getTime())) throw new ApiError('Invalid date', 400);

    const now = currentMonthYear();
    const { month, year } = monthYearSchema.parse({
      month: searchParams.get('month') ?? now.month,
      year: searchParams.get('year') ?? now.year,
    });
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(monthStart);

    const [today, records] = await Promise.all([
      Attendance.find({ date: { $gte: startOfDay(day), $lte: endOfDay(day) } })
        .populate('member', MEMBER_FIELDS)
        .sort({ checkInTime: -1 })
        .lean(),
      Attendance.find({ date: { $gte: monthStart, $lte: monthEnd } })
        .select('member date')
        .lean(),
    ]);

    // Daily counts for the heatmap
    const counts = new Map<string, number>();
    const perMember = new Map<string, number>();
    for (const r of records) {
      const key = format(r.date, 'yyyy-MM-dd');
      counts.set(key, (counts.get(key) ?? 0) + 1);
      const m = r.member.toString();
      perMember.set(m, (perMember.get(m) ?? 0) + 1);
    }
    const daily = Array.from({ length: getDaysInMonth(monthStart) }, (_, i) => {
      const key = format(new Date(year, month - 1, i + 1), 'yyyy-MM-dd');
      return { date: key, count: counts.get(key) ?? 0 };
    });

    // Average over elapsed days only (for the current month)
    const todayStart = startOfDay(new Date());
    const elapsedDays = isAfter(monthEnd, todayStart)
      ? Math.max(daily.filter((d) => !isAfter(new Date(`${d.date}T00:00:00`), todayStart)).length, 1)
      : daily.length;
    const averageDaily = Math.round((records.length / elapsedDays) * 10) / 10;

    // Most active members
    const topIds = Array.from(perMember.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topUsers = await User.find({ _id: { $in: topIds.map(([id]) => id) } })
      .select(MEMBER_FIELDS)
      .lean();
    const userMap = new Map(topUsers.map((u) => [u._id.toString(), u]));
    const topMembers = topIds
      .filter(([id]) => userMap.has(id))
      .map(([id, count]) => ({ member: userMap.get(id) as unknown as MemberSummary, count }));

    const data: Omit<AttendanceOverview, 'today'> & { today: unknown[] } = {
      date: format(day, 'yyyy-MM-dd'),
      today,
      month,
      year,
      daily,
      topMembers,
      averageDaily,
      totalThisMonth: records.length,
    };
    return ok(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/attendance
 * Member: check in for today.
 * Admin:  check in a member on their behalf → { memberId }
 */
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = sanitize(await readJson<Record<string, unknown>>(req).catch(() => ({})));
    const { memberId } = markAttendanceSchema.parse(body);

    const targetId = session.user.role === 'admin' ? memberId : session.user.id;
    if (!targetId) throw new ApiError('Select a member to check in', 422);

    await connectDB();
    const member = await User.findOne({ _id: targetId, role: 'member' }).select('name isActive').lean();
    if (!member) throw new ApiError('Member not found', 404);
    if (!member.isActive) throw new ApiError('Membership is inactive — check-in not allowed', 403);

    const now = new Date();
    try {
      const record = await Attendance.create({ member: targetId, date: startOfDay(now), checkInTime: now });
      return ok(record, 201);
    } catch (err) {
      if (typeof err === 'object' && err && 'code' in err && (err as { code: number }).code === 11000) {
        throw new ApiError(
          session.user.role === 'admin' ? `${member.name} already checked in today` : 'Already checked in today',
          409,
        );
      }
      throw err;
    }
  } catch (error) {
    return handleError(error);
  }
}
