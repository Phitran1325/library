import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReservationStatus = 'Pending' | 'Assigned' | 'Fulfilled' | 'Cancelled' | 'Expired' | 'Rejected';

export interface IReservation extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  status: ReservationStatus;
  expiresAt?: Date;
  assignedAt?: Date;
  fulfilledAt?: Date;
  rejectionReason?: string;
  rejectedBy?: Types.ObjectId; // Thủ thư từ chối đặt trước
  queuePosition?: number; // Vị trí trong hàng chờ
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Assigned', 'Fulfilled', 'Cancelled', 'Expired', 'Rejected'], 
      default: 'Pending' 
    },
    expiresAt: { type: Date },
    assignedAt: { type: Date },
    fulfilledAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: [300, 'Lý do từ chối không được vượt quá 300 ký tự'] },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    queuePosition: { type: Number, default: 0 }
  },
  { timestamps: true }
);

reservationSchema.index({ user: 1, book: 1, status: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });
reservationSchema.index({ rejectedBy: 1, status: 1 });
reservationSchema.index({ book: 1, status: 1, queuePosition: 1 });

export default mongoose.model<IReservation>('Reservation', reservationSchema);


