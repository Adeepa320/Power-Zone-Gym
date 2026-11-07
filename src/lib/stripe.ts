import Stripe from 'stripe';
import { ApiError } from './api';

let stripeClient: Stripe | null = null;

/** ISO currency for Stripe Checkout. "Rs." maps to lkr / inr / pkr — set STRIPE_CURRENCY. */
export const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'lkr').toLowerCase();

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Lazily create the Stripe client so the app still runs without Stripe keys. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new ApiError('Online payments are not configured yet. Please pay at the front desk.', 503);
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, { appInfo: { name: 'Power Zone Gym' } });
  }
  return stripeClient;
}

/** Convert rupees to the smallest currency unit (cents/paisa). */
export function toStripeAmount(amount: number) {
  return Math.round(amount * 100);
}
