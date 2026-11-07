import type { FilterQuery } from 'mongoose';
import { connectDB } from '@/lib/db';
import { ApiError, handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { checkoutSchema, membershipCategorySchema, monthYearSchema, objectIdSchema } from '@/lib/validations';
import { ensureMonthlyPayments } from '@/lib/payments';
import { getStripe, STRIPE_CURRENCY, toStripeAmount } from '@/lib/stripe';
import { categoryLabel, currentMonthYear, escapeRegex, monthLabel } from '@/lib/utils';
import { GYM } from '@/lib/constants';
import Payment, { type PaymentDoc } from '@/models/Payment';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const MEMBER_FIELDS = 'name email phone membershipCategory profileImage isActive';

/**
 * GET /api/payments
 * Admin: query month, year, status, category, method, memberId, search
 * Member: returns their own payment history (newest first)
 */
export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();
    await ensureMonthlyPayments();
    const { searchParams } = new URL(req.url);

    if (session.user.role !== 'admin') {
      const payments = await Payment.find({ member: session.user.id })
        .populate('markedBy', 'name')
        .sort({ year: -1, month: -1 })
        .lean();
      return ok(payments);
    }

    const filter: FilterQuery<PaymentDoc> = {};
    const memberId = searchParams.get('memberId');
    if (memberId) filter.member = objectIdSchema.parse(memberId);

    if (searchParams.get('month') && searchParams.get('year')) {
      const { month, year } = monthYearSchema.parse({
        month: searchParams.get('month'),
        year: searchParams.get('year'),
      });
      filter.month = month;
      filter.year = year;
    }

    const status = searchParams.get('status');
    if (status && ['paid', 'pending', 'overdue'].includes(status)) filter.paymentStatus = status;
    const method = searchParams.get('method');
    if (method && ['online', 'cash'].includes(method)) filter.paymentMethod = method;

    // Category & search filter apply to the member, so resolve member ids first.
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();
    if ((category && membershipCategorySchema.safeParse(category).success) || search) {
      const memberFilter: Record<string, unknown> = { role: 'member' };
      if (category) memberFilter.membershipCategory = category;
      if (search) {
        const rx = new RegExp(escapeRegex(search), 'i');
        memberFilter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
      }
      const ids = await User.find(memberFilter).distinct('_id');
      filter.member = memberId ? { $in: ids.filter((i) => i.toString() === memberId) } : { $in: ids };
    }

    const payments = await Payment.find(filter)
      .populate('member', MEMBER_FIELDS)
      .populate('markedBy', 'name')
      .sort({ year: -1, month: -1, paidAt: -1, createdAt: -1 })
      .limit(1000)
      .lean();

    return ok(payments);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/payments
 * Member: create a Stripe Checkout session for an unpaid payment
 *         (defaults to the current month) → { url }
 * Admin:  generate pending dues for all active members for { month, year }
 */
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();
    const body = sanitize(await readJson<Record<string, unknown>>(req).catch(() => ({})));

    if (session.user.role === 'admin') {
      const { month, year } = monthYearSchema.parse(body);
      const result = await ensureMonthlyPayments({ month, year, force: true });
      return ok({ ...result, month, year }, 201);
    }

    // ----- Member: Stripe Checkout -----
    const { paymentId } = checkoutSchema.parse(body);
    const { month, year } = currentMonthYear();
    const payment = paymentId
      ? await Payment.findOne({ _id: paymentId, member: session.user.id })
      : await Payment.findOne({ member: session.user.id, month, year });

    if (!payment) throw new ApiError('No payment record found for this month', 404);
    if (payment.paymentStatus === 'paid') throw new ApiError('This month is already paid', 409);

    const member = await User.findById(session.user.id).select('name email membershipCategory').lean();
    if (!member) throw new ApiError('Member not found', 404);

    const stripe = getStripe();
    const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;

    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: member.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: toStripeAmount(payment.amount),
            product_data: {
              name: `${GYM.name} — ${categoryLabel(member.membershipCategory)}`,
              description: `Membership fee for ${monthLabel(payment.month, payment.year)}`,
            },
          },
        },
      ],
      metadata: {
        paymentId: payment._id.toString(),
        memberId: session.user.id,
        month: String(payment.month),
        year: String(payment.year),
      },
      success_url: `${baseUrl}/member/payments?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/member/payments?status=cancelled`,
    });

    payment.stripeSessionId = checkout.id;
    await payment.save();

    return ok({ url: checkout.url, sessionId: checkout.id }, 201);
  } catch (error) {
    return handleError(error);
  }
}
