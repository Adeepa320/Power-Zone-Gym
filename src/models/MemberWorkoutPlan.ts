import { Schema, model, models, type Model, type Types, type InferSchemaType } from 'mongoose';

/**
 * A member's personalised, multi-day workout routine.
 * Exactly one active plan per member (unique index on `member`).
 * Mirrors how trainers write routines on WhatsApp:
 *   "1 day — Incline flies 12 10 8, Bench press 12 10 8 …"
 */
const exerciseSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  /** Free-form sets/reps exactly as the trainer writes it: "12 10 8", "4 x 12", "10-3", "Till failure". */
  setsReps: { type: String, trim: true, default: '', maxlength: 60 },
  notes: { type: String, trim: true, default: '', maxlength: 200 },
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
