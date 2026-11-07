import { connectDB } from '@/lib/db';
import { ApiError, handleError, ok, requireAuth } from '@/lib/api';
import { getStripe } from '@/lib/stripe';
import { confirmCheckoutSession } from '@/lib/payments';
import Payment from '@/models/Payment';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/verify?session_id=cs_...
 * Called by the member's payment page after returning from Stripe Checkout.
 * Confirms the session directly with Stripe so the status updates instantly,
 * even if the webhook hasn't arrived yet (e.g. local development).
 */
export async function GET(req: Request) {
  try {
    const session = await requireAuth('member');
    const sessionId = new URL(req.url).searchParams.get('session_id');
    if (!sessionId || !sessionId.startsWith('cs_')) throw new ApiError('Invalid session id', 400);

    const checkout = await getStripe().checkout.sessions.retrieve(sessionId);
    if (checkout.metadata?.memberId !== session.user.id) {
      throw new ApiError('This checkout session does not belong to you', 403);
    }

    await connectDB();
    await confirmCheckoutSession(checkout);
    const payment = await Payment.findById(checkout.metadata?.paymentId).lean();

    return ok({ paid: payment?.paymentStatus === 'paid', payment });
  } catch (error) {
    return handleError(error);
  }
}
