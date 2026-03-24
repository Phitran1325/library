import mongoose, { Document, Schema } from 'mongoose';

export type SubscriptionAction = 'Subscribe' | 'Switch' | 'Renew' | 'Cancel' | 'AdminAssign';

export interface ISubscriptionHistory extends Document {
  user: mongoose.Types.ObjectId;
  action: SubscriptionAction;
  oldPlan?: mongoose.Types.ObjectId;
  newPlan?: mongoose.Types.ObjectId;
  note?: string;
  at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionHistorySchema = new Schema<ISubscriptionHistory>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, enum: ['Subscribe', 'Switch', 'Renew', 'Cancel', 'AdminAssign'], required: true, index: true },
  oldPlan: { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
  newPlan: { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
  note: { type: String },
  at: { type: Date, default: () => new Date() }
}, {
  timestamps: true
});

subscriptionHistorySchema.index({ user: 1, at: -1 });

const SubscriptionHistory = mongoose.model<ISubscriptionHistory>('SubscriptionHistory', subscriptionHistorySchema);
export default SubscriptionHistory;


