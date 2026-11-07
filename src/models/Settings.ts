import { Schema, model, models, type Model, type Types, type InferSchemaType } from 'mongoose';
import { MEMBERSHIP_PRICING } from '@/lib/constants';

/**
 * Singleton settings document (key = "global").
 * Holds admin-configurable membership pricing.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    pricing: {
      normal: { type: Number, default: MEMBERSHIP_PRICING.normal, min: 0 },
      cardio: { type: Number, default: MEMBERSHIP_PRICING.cardio, min: 0 },
      personal_training: { type: Number, default: MEMBERSHIP_PRICING.personal_training, min: 0 },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema> & { _id: Types.ObjectId };

const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) || model<SettingsDoc>('Settings', settingsSchema);
export default Settings;
