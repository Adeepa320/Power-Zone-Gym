import type Stripe from 'stripe';
import { connectDB } from './db';
import { getPricing } from './settings';
import { currentMonthYear } from './utils';
import User from '@/models/User';
import Payment from '@/models/Payment';

/**
 * Payment status rules:
 *  - current month, unpaid → 'pending'
 *  - past month, unpaid    → 'overdue'
 *  - confirmed             → 'paid'
 */

// Throttle: run the generation at most once every 10 minutes per server instance.
const ENSURE_INTERVAL_MS = 10 * 60 * 1000;
let lastEnsure: { key: string; at: number } | null = null;

/** Mark every unpaid record from a previous month as overdue. */
export async function syncOverdueStatuses() {
  const { month, year } = currentMonthYear();
  await Payment.updateMany(
    {
      paymentStatus: 'pending',
      $or: [{ year: { $lt: year } }, { year, month: { $lt: month } }],
    },
    { $set: { paymentStatus: 'overdue' } },
  );
}

/**
 * Generate pending payment records for every active member for the given month
 * (defaults to the current month). Idempotent thanks to the unique
 * (member, year, month) index and `$setOnInsert`.
 */
export async function ensureMonthlyPayments(opts: { month?: number; year?: number; force?: boolean } = {}) {
  const now = currentMonthYear();
  const month = opts.month ?? now.month;
  const year = opts.year ?? now.year;
  const key = `${year}-${month}`;

  if (!opts.force && lastEnsure && lastEnsure.key === key && Date.now() - lastEnsure.at < ENSURE_INTERVAL_MS) {
    return { created: 0, skipped: true };
  }

  await connectDB();
  const [pricing, members] = await Promise.all([
    getPricing(),
    User.find({ role: 'member', isActive: true }).select('_id membershipCategory').lean(),
  ]);

  const isPast = year < now.year || (year === now.year && month < now.month);
  let created = 0;

  if (members.length > 0) {
    const result = await Payment.bulkWrite(
      members.map((m) => ({
        updateOne: {
          filter: { member: m._id, month, year },
          update: {
            $setOnInsert: {
              member: m._id,
              month,
              year,
              amount: pricing[m.membershipCategory],
              paymentStatus: isPast ? 'overdue' : 'pending',
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    created = result.upsertedCount;
  }

  await syncOverdueStatuses();
  if (key === `${now.year}-${now.month}`) lastEnsure = { key, at: Date.now() };
  return { created, skipped: false };
}

/** Create (if missing) the current month's pending payment for a single member. */
export async function ensureMemberCurrentPayment(memberId: string, category: keyof Awaited<ReturnType<typeof getPricing>>) {
  const { month, year } = currentMonthYear();
  const pricing = await getPricing();
  return Payment.findOneAndUpdate(
    { member: memberId, month, year },
    {
      $setOnInsert: {
        member: memberId,
        month,
        year,
        amount: pricing[category],
        paymentStatus: 'pending',
      },
    },
    { upsert: true, new: true },
  );
}

/**
 * Mark the payment referenced by a completed Checkout Session as paid.
 * Shared by the Stripe webhook and the success-page verification endpoint,
 * and safe to call more than once.
 */
export async function confirmCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return null;
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return null;

  await connectDB();
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

  return Payment.findOneAndUpdate(
    { _id: paymentId, paymentStatus: { $ne: 'paid' } },
    {
      $set: {
        paymentStatus: 'paid',
        paymentMethod: 'online',
        stripeSessionId: session.id,
        stripePaymentId: paymentIntentId,
        paidAt: new Date(),
      },
    },
    { new: true },
  );
}
