import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Canceled';
export type PaymentType = 'Membership' | 'Rental' | 'Debt';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  type: PaymentType;
  // Membership payment
  plan?: mongoose.Types.ObjectId;
  // Rental payment
  book?: mongoose.Types.ObjectId;
  rentalDays?: number;

  amount: number;
  currency: string;
  provider: 'PayOS';
  providerRef: string; // orderCode / transaction id
  checkoutUrl?: string;
  status: PaymentStatus;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['Membership', 'Rental', 'Debt'], required: true, index: true },
  plan: { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
  book: { type: Schema.Types.ObjectId, ref: 'Book' },
  rentalDays: { type: Number, min: 1, max: 7 },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'VND' },
  provider: { type: String, enum: ['PayOS'], required: true },
  providerRef: { type: String, required: true, unique: true },
  checkoutUrl: { type: String },
  status: { type: String, enum: ['Pending', 'Succeeded', 'Failed', 'Canceled'], default: 'Pending', index: true },
  expiresAt: { type: Date },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

paymentSchema.index({ provider: 1, providerRef: 1 }, { unique: true });
paymentSchema.index({ user: 1, type: 1, status: 1 });
paymentSchema.index({ type: 1, plan: 1 });
paymentSchema.index({ type: 1, book: 1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;


