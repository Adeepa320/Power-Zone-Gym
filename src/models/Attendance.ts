import { Schema, model, models, type Model, type Types, type InferSchemaType } from 'mongoose';

const attendanceSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Normalised to the start of the day — used to enforce one check-in per day. */
    date: { type: Date, required: true },
    checkInTime: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Compound unique index ensures one check-in per member per day.
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });

export type AttendanceDoc = InferSchemaType<typeof attendanceSchema> & { _id: Types.ObjectId };

const Attendance: Model<AttendanceDoc> =
  (models.Attendance as Model<AttendanceDoc>) ||
  model<AttendanceDoc>('Attendance', attendanceSchema);
export default Attendance;
