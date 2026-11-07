import type Stripe from 'stripe';
import { fail, ok } from '@/lib/api';
import { getStripe } from '@/lib/stripe';
import { confirmCheckoutSession } from '@/lib/payments';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/stripe-webhook
 * Stripe calls this after checkout. The raw body is required for signature verification.
 * Local testing: `stripe listen --forward-to localhost:3000/api/payments/stripe-webhook`
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret) return fail('Webhook secret not configured', 500);
  if (!signature) return fail('Missing Stripe signature', 400);

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    console.error('[stripe-webhook] signature verification failed', error);
    return fail('Invalid signature', 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        await confirmCheckoutSession(session);
        break;
      }
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
        // Payment stays pending; the member can retry from their dashboard.
        break;
      default:
        break;
    }
    return ok({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] handler error', error);
    // Non-2xx makes Stripe retry delivery.
    return fail('Webhook handler failed', 500);
  }
}
