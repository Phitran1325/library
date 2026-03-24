import mongoose, { Schema, Document, Types } from 'mongoose';

export type DebtPaymentMethod = 'PayOS' | 'External' | 'Manual';
export type DebtPaymentStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IDebtPayment extends Document {
  user: Types.ObjectId;
  amount: number;
  method: DebtPaymentMethod;
  status?: DebtPaymentStatus; // For manual payments
  debtBefore: number;
  debtAfter: number;
  processedBy?: Types.ObjectId; // Librarian/Admin who approved/rejected
  processedAt?: Date;
  notes?: string; // Notes from user or librarian
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const debtPaymentSchema = new Schema<IDebtPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: [0, 'Số tiền thanh toán phải không âm'] },
    method: {
      type: String,
      enum: ['PayOS', 'External', 'Manual'],
      required: true,
      default: 'Manual'
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    debtBefore: { type: Number, required: true, min: 0 },
    debtAfter: { type: Number, required: true, min: 0 },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    processedAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

debtPaymentSchema.index({ createdAt: -1 });
debtPaymentSchema.index({ status: 1, createdAt: -1 });
debtPaymentSchema.index({ user: 1, status: 1 });

export default mongoose.model<IDebtPayment>('DebtPayment', debtPaymentSchema);


