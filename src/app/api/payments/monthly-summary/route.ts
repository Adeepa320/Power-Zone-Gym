import { connectDB } from '@/lib/db';
import { handleError, ok, requireAuth } from '@/lib/api';
import { monthYearSchema } from '@/lib/validations';
import { ensureMonthlyPayments } from '@/lib/payments';
import { currentMonthYear } from '@/lib/utils';
import Payment from '@/models/Payment';
import type { MembershipCategory, MonthlySummary } from '@/types';

export const dynamic = 'force-dynamic';

/** GET /api/payments/monthly-summary?month=&year=  (admin) */
export async function GET(req: Request) {
  try {
    await requireAuth('admin');
    await connectDB();
    await ensureMonthlyPayments();

    const { searchParams } = new URL(req.url);
    const now = currentMonthYear();
    const { month, year } = monthYearSchema.parse({
      month: searchParams.get('month') ?? now.month,
      year: searchParams.get('year') ?? now.year,
    });

    const rows = await Payment.aggregate<{
      _id: { status: string; method: string | null; category: MembershipCategory };
      amount: number;
      count: number;
    }>([
      { $match: { month, year } },
      { $lookup: { from: 'users', localField: 'member', foreignField: '_id', as: 'm' } },
      { $unwind: '$m' },
      {
        $group: {
          _id: { status: '$paymentStatus', method: '$paymentMethod', category: '$m.membershipCategory' },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary: MonthlySummary = {
      month,
      year,
      totalExpected: 0,
      totalCollected: 0,
      totalPending: 0,
      totalOverdue: 0,
      counts: { paid: 0, pending: 0, overdue: 0, total: 0 },
      byMethod: { online: 0, cash: 0 },
      byCategory: {
        normal: { expected: 0, collected: 0, count: 0 },
        cardio: { expected: 0, collected: 0, count: 0 },
        personal_training: { expected: 0, collected: 0, count: 0 },
      },
    };

    for (const row of rows) {
      const { status, method, category } = row._id;
      summary.totalExpected += row.amount;
      summary.counts.total += row.count;
      const cat = summary.byCategory[category];
      if (cat) {
        cat.expected += row.amount;
        cat.count += row.count;
      }
      if (status === 'paid') {
        summary.totalCollected += row.amount;
        summary.counts.paid += row.count;
        if (cat) cat.collected += row.amount;
        if (method === 'online' || method === 'cash') summary.byMethod[method] += row.amount;
      } else if (status === 'pending') {
        summary.totalPending += row.amount;
        summary.counts.pending += row.count;
      } else if (status === 'overdue') {
        summary.totalOverdue += row.amount;
        summary.counts.overdue += row.count;
      }
    }

    return ok(summary);
  } catch (error) {
    return handleError(error);
  }
}
