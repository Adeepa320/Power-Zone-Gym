import { Schema, model, models, type Model, type Types, type InferSchemaType } from 'mongoose';

const exerciseSchema = new Schema({
  name: { type: String, required: true, trim: true },
  sets: { type: Number, required: true, min: 1, max: 20 },
  reps: { type: String, required: true, trim: true }, // "12", "12-15", "Till failure"
  restTime: { type: String, required: true, trim: true }, // "60 sec"
  notes: { type: String, trim: true },
  imageUrl: { type: String }, // Exercise illustration (data URL or /images path)
});

const workoutChartSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    category: {
      type: String,
      enum: ['chest', 'back', 'legs', 'shoulders', 'arms', 'abs', 'cardio', 'full_body', 'custom'],
      required: true,
    },
    description: { type: String, trim: true },
    exercises: { type: [exerciseSchema], default: [] },
    // Optional chart image (e.g. the image shared on WhatsApp) — stored as data URL.
    chartImage: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

workoutChartSchema.index({ category: 1 });
workoutChartSchema.index({ assignedTo: 1 });

export type WorkoutChartDoc = InferSchemaType<typeof workoutChartSchema> & { _id: Types.ObjectId };

const WorkoutChart: Model<WorkoutChartDoc> =
  (models.WorkoutChart as Model<WorkoutChartDoc>) ||
  model<WorkoutChartDoc>('WorkoutChart', workoutChartSchema);
export default WorkoutChart;
