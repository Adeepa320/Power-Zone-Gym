import { connectDB } from '@/lib/db';
import { handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { settingsSchema } from '@/lib/validations';
import { getPricing } from '@/lib/settings';
import { currentMonthYear } from '@/lib/utils';
import Settings from '@/models/Settings';
import Payment from '@/models/Payment';
import User from '@/models/User';
import type { MembershipCategory } from '@/types';

export const dynamic = 'force-dynamic';

/** GET /api/settings — public (pricing is shown on the registration page). */
export async function GET() {
  try {
    await connectDB();
    const pricing = await getPricing();
    return ok({ pricing });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/settings  (admin)
 * Body: { pricing: { normal, cardio, personal_training }, applyToPending?: boolean }
 * When applyToPending is true, unpaid payments for the current month are re-priced.
 */
export async function PUT(req: Request) {
  try {
    const session = await requireAuth('admin');
    const { pricing, applyToPending } = settingsSchema.parse(sanitize(await readJson(req)));
    await connectDB();

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: { pricing, updatedBy: session.user.id } },
      { upsert: true, new: true, lean: true },
    );

    let repriced = 0;
    if (applyToPending) {
      const { month, year } = currentMonthYear();
      const categories = Object.keys(pricing) as MembershipCategory[];
      for (const category of categories) {
        const ids = await User.find({ role: 'member', membershipCategory: category }).distinct('_id');
        const res = await Payment.updateMany(
          { member: { $in: ids }, month, year, paymentStatus: 'pending' },
          { $set: { amount: pricing[category] } },
        );
        repriced += res.modifiedCount;
      }
    }

    return ok({ pricing: settings?.pricing, updatedAt: settings?.updatedAt, repriced });
  } catch (error) {
    return handleError(error);
  }
}
