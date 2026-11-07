import { connectDB } from '@/lib/db';
import { ApiError, handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { markCashSchema } from '@/lib/validations';
import { monthLabel } from '@/lib/utils';
import Payment from '@/models/Payment';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/mark-cash  (admin)
 * Body: { memberId, month, year, amount }
 * Marks (or creates) the member's payment for that month as paid in cash,
 * recording which admin marked it and when.
 */
export async function POST(req: Request) {
  try {
    const session = await requireAuth('admin');
    const data = markCashSchema.parse(sanitize(await readJson(req)));

    await connectDB();
    const member = await User.findOne({ _id: data.memberId, role: 'member' }).select('name').lean();
    if (!member) throw new ApiError('Member not found', 404);

    const existing = await Payment.findOne({ member: data.memberId, month: data.month, year: data.year });
    if (existing?.paymentStatus === 'paid') {
      throw new ApiError(`${member.name} has already paid for ${monthLabel(data.month, data.year)}`, 409);
    }

    const now = new Date();
    const payment = await Payment.findOneAndUpdate(
      { member: data.memberId, month: data.month, year: data.year },
      {
        $set: {
          amount: data.amount,
          paymentStatus: 'paid',
          paymentMethod: 'cash',
          markedBy: session.user.id,
          markedAt: now,
          paidAt: now,
        },
        $setOnInsert: { member: data.memberId, month: data.month, year: data.year },
      },
      { upsert: true, new: true },
    )
      .populate('member', 'name email membershipCategory')
      .populate('markedBy', 'name')
      .lean();

    return ok(payment);
  } catch (error) {
    return handleError(error);
  }
}
