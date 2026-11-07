import { Schema, model, models, type Model, type Types, type InferSchemaType } from 'mongoose';

const paymentSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    paymentMethod: { type: String, enum: ['online', 'cash'] },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
      required: true,
    },

    // Online payment details
    stripePaymentId: { type: String },
    stripeSessionId: { type: String },

    // Cash payment details (marked by admin)
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    markedAt: { type: Date },

    paidAt: { type: Date },
  },
  { timestamps: true },
);

// One payment record per member per month.
paymentSchema.index({ member: 1, year: 1, month: 1 }, { unique: true });
paymentSchema.index({ year: 1, month: 1, paymentStatus: 1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ stripeSessionId: 1 }, { sparse: true });

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: Types.ObjectId };

const Payment: Model<PaymentDoc> =
  (models.Payment as Model<PaymentDoc>) || model<PaymentDoc>('Payment', paymentSchema);
export default Payment;
