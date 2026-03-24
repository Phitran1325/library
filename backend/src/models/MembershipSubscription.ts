import mongoose, { Document, Schema } from 'mongoose';

export type SubscriptionStatus = 'Active' | 'Expired' | 'Canceled';
export type SubscriptionSource = 'Payment' | 'Admin';

export interface IMembershipSubscription extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  previousSubscriptionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSubscriptionSchema = new Schema<IMembershipSubscription>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: Schema.Types.ObjectId, ref: 'MembershipPlan', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Expired', 'Canceled'], required: true, index: true },
  source: { type: String, enum: ['Payment', 'Admin'], required: true },
  previousSubscriptionId: { type: Schema.Types.ObjectId, ref: 'MembershipSubscription' }
}, {
  timestamps: true
});

membershipSubscriptionSchema.index({ user: 1, status: 1 });
membershipSubscriptionSchema.index({ user: 1, startDate: -1 });

const MembershipSubscription = mongoose.model<IMembershipSubscription>('MembershipSubscription', membershipSubscriptionSchema);
export default MembershipSubscription;


