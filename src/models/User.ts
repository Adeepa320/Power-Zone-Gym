import { Schema, model, models, type Model, type Types, type InferSchemaType } from 'mongoose';

const weightEntrySchema = new Schema(
  {
    weight: { type: Number, required: true, min: 20, max: 400 },
    date: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 12, max: 100 },
    gender: { type: String, enum: ['male', 'female'], required: true },
    // Optional — avatar initials are shown when not set.
    profileImage: { type: String },

    // Gym-specific details
    weight: { type: Number, required: true, min: 20, max: 400 },
    height: { type: Number, required: true, min: 100, max: 250 },
    bodyType: { type: String, required: true },
    healthConditions: { type: String, trim: true, default: '' },
    fitnessGoal: { type: String, required: true },
    weightHistory: { type: [weightEntrySchema], default: [] },

    // Membership
    membershipCategory: {
      type: String,
      enum: ['normal', 'cardio', 'personal_training'],
      default: 'normal',
      required: true,
    },
    registeredDate: { type: Date, default: Date.now },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ membershipCategory: 1 });
userSchema.index({ name: 'text', email: 'text' });
userSchema.index({ createdAt: -1 });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

const User: Model<UserDoc> = (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema);
export default User;
