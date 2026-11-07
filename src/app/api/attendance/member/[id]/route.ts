import { endOfMonth, startOfMonth } from 'date-fns';
import { connectDB } from '@/lib/db';
import { assertSelfOrAdmin, handleError, ok, requireAuth } from '@/lib/api';
import { monthYearSchema, objectIdSchema } from '@/lib/validations';
import { computeStreaks } from '@/lib/utils';
import Attendance from '@/models/Attendance';
import type { MemberAttendance } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/attendance/member/:id?month=&year=
 * Admin or the member themself. Without month/year returns the full history.
 * Always includes all-time total and current / longest streak.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const id = objectIdSchema.parse(params.id);
    assertSelfOrAdmin(session, id);
    await connectDB();

    const { searchParams } = new URL(req.url);
    let period: { month: number; year: number } | null = null;
    if (searchParams.get('month') && searchParams.get('year')) {
      period = monthYearSchema.parse({ month: searchParams.get('month'), year: searchParams.get('year') });
    }

    const allDates = await Attendance.find({ member: id }).select('date').sort({ date: -1 }).lean();
    const { current, longest } = computeStreaks(allDates.map((a) => a.date));

    const filter: Record<string, unknown> = { member: id };
    if (period) {
      const start = startOfMonth(new Date(period.year, period.month - 1, 1));
      filter.date = { $gte: start, $lte: endOfMonth(start) };
    }
    const records = await Attendance.find(filter).sort({ date: -1 }).limit(period ? 31 : 500).lean();

    const data: Omit<MemberAttendance, 'records'> & { records: unknown[] } = {
      records,
      month: period?.month ?? null,
      year: period?.year ?? null,
      totalInPeriod: records.length,
      totalAllTime: allDates.length,
      streak: current,
      longestStreak: longest,
    };
    return ok(data);
  } catch (error) {
    return handleError(error);
  }
}
