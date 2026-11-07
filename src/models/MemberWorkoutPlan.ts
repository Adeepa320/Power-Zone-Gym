import { Schema, model, models, type Model, type Types, type InferSchemaType } from 'mongoose';

/**
 * A member's personalised, multi-day workout routine.
 * Exactly one active plan per member (unique index on `member`).
 * Mirrors how trainers write routines on WhatsApp:
 *   "1 day — Incline flies 12 10 8, Bench press 12 10 8 …"
 */
const exerciseSchema = new Schema({
  /** Required for exercises; empty for divider rows. */
  name: {
    type: String,
    trim: true,
    default: '',
    maxlength: 120,
    validate: {
      validator(this: { isGroupDivider?: boolean }, v: string) {
        return Boolean(this.isGroupDivider) || Boolean(v?.trim());
      },
      message: 'Exercise name is required',
    },
  },
  /** Free-form sets/reps exactly as the trainer writes it: "12 10 8", "4 x 12", "10-3", "Till failure". */
  setsReps: { type: String, trim: true, default: '', maxlength: 60 },
  notes: { type: String, trim: true, default: '', maxlength: 200 },
  /**
   * Divider row: separates muscle groups inside one day (e.g. chest exercises, then biceps).
   * Rendered as a gap with an optional label — like the blank line in a WhatsApp routine.
   */
  isGroupDivider: { type: Boolean, default: false },
  /** Optional muscle-group label shown on a divider, e.g. "Biceps". */
  groupTitle: { type: String, trim: true, default: '', maxlength: 60 },
});

const daySchema = new Schema({
  dayNumber: { type: Number, required: true, min: 1, max: 14 },
  dayTitle: { type: String, trim: true, default: '', maxlength: 80 },
  exercises: { type: [exerciseSchema], default: [] },
});

const memberWorkoutPlanSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    gymName: { type: String, required: true, trim: true, maxlength: 80 },
    planTitle: { type: String, required: true, trim: true, maxlength: 120 },
    startDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, default: '', maxlength: 1000 },
    days: { type: [daySchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

memberWorkoutPlanSchema.index({ updatedAt: -1 });

export type MemberWorkoutPlanDoc = InferSchemaType<typeof memberWorkoutPlanSchema> & { _id: Types.ObjectId };

const MemberWorkoutPlan: Model<MemberWorkoutPlanDoc> =
  (models.MemberWorkoutPlan as Model<MemberWorkoutPlanDoc>) ||
  model<MemberWorkoutPlanDoc>('MemberWorkoutPlan', memberWorkoutPlanSchema);
export default MemberWorkoutPlan;
