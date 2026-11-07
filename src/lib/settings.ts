import Settings from '@/models/Settings';
import { MEMBERSHIP_PRICING } from './constants';
import type { MembershipCategory, Pricing } from '@/types';

/** Load (or lazily create) the singleton settings document. Requires an open DB connection. */
export async function getSettings() {
  const settings = await Settings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', pricing: { ...MEMBERSHIP_PRICING } } },
    { upsert: true, new: true, lean: true },
  );
  return settings!;
}

export async function getPricing(): Promise<Pricing> {
  const settings = await getSettings();
  return {
    normal: settings.pricing?.normal ?? MEMBERSHIP_PRICING.normal,
    cardio: settings.pricing?.cardio ?? MEMBERSHIP_PRICING.cardio,
    personal_training: settings.pricing?.personal_training ?? MEMBERSHIP_PRICING.personal_training,
  };
}

export async function getFee(category: MembershipCategory) {
  const pricing = await getPricing();
  return pricing[category];
}
