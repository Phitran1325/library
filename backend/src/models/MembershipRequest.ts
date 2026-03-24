import mongoose, { Document, Schema } from 'mongoose';

export type MembershipRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IMembershipRequest extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: MembershipRequestStatus;
  requestDate: Date;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const membershipRequestSchema = new Schema<IMembershipRequest>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: Schema.Types.ObjectId, ref: 'MembershipPlan', required: true, index: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', required: true, index: true },
  requestDate: { type: Date, default: Date.now, required: true },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  rejectionReason: { type: String },
  notes: { type: String }
}, {
  timestamps: true
});

membershipRequestSchema.index({ user: 1, status: 1 });
membershipRequestSchema.index({ user: 1, createdAt: -1 });
membershipRequestSchema.index({ status: 1, createdAt: -1 });

const MembershipRequest = mongoose.model<IMembershipRequest>('MembershipRequest', membershipRequestSchema);
export default MembershipRequest;
