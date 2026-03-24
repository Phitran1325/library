import mongoose, { Schema, Document, Types } from 'mongoose';
import Borrow from './Borrow';

export type ViolationType = 'Overdue' | 'Damaged' | 'Lost' | 'LateReturn';

export interface IViolation extends Document {
  user: Types.ObjectId;
  type: ViolationType;
  severity: 'Low' | 'Medium' | 'High';
  borrowId: Types.ObjectId;
  description: string;
  createdAt: Date;
}

const violationSchema = new Schema<IViolation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['Overdue', 'Damaged', 'Lost', 'LateReturn'],
      required: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    borrowId: {
      type: Schema.Types.ObjectId,
      ref: 'Borrow',
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Mô tả vi phạm không được vượt quá 500 ký tự']
    }
  },
  { timestamps: true }
);

violationSchema.index({ user: 1, createdAt: -1 });
violationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model<IViolation>('Violation', violationSchema);


