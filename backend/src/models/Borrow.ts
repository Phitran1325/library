import mongoose, { Schema, Document, Types } from 'mongoose';

export type BorrowStatus = 'Pending' | 'Borrowed' | 'Returned' | 'Overdue' | 'Lost' | 'Damaged' | 'Cancelled' | 'ReturnRequested';
export type BorrowType = 'Membership' | 'Rental';

export interface IBorrow extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  bookCopy?: Types.ObjectId; // liên kết bản sao vật lý nếu có
  borrowType: BorrowType;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: BorrowStatus;
  renewalCount: number;
  maxRenewals: number; // Số lần gia hạn tối đa tại thời điểm mượn
  lateFee: number;
  damageFee: number;
  // Rental-only fields
  rentalDays?: number;
  rentalPricePerDay?: number;
  totalRentalPrice?: number;
  paymentId?: string; // providerRef of payment
  notes?: string; // Ghi chú về tình trạng sách khi trả
  processedBy?: Types.ObjectId; // Thủ thư xử lý (Lost/Damaged)
  createdAt: Date;
  updatedAt: Date;
}

const borrowSchema = new Schema<IBorrow>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người mượn là bắt buộc'],
      index: true
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Sách là bắt buộc'],
      index: true
    },
    bookCopy: {
      type: Schema.Types.ObjectId,
      ref: 'BookCopy',
      index: true
    },
    borrowType: {
      type: String,
      enum: ['Membership', 'Rental'],
      required: true,
      default: 'Membership',
      index: true
    },
    borrowDate: {
      type: Date,
      // Required chỉ khi status !== 'Pending'
    },
    dueDate: {
      type: Date,
      // Required chỉ khi status !== 'Pending'
    },
    returnDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Pending', 'Borrowed', 'Returned', 'Overdue', 'Lost', 'Damaged', 'Cancelled', 'ReturnRequested'],
      default: 'Pending',
      index: true
    },
    renewalCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lần gia hạn không được âm']
    },
    maxRenewals: {
      type: Number,
      required: true,
      min: [0, 'Số lần gia hạn tối đa không được âm'],
      default: 1
    },
    lateFee: {
      type: Number,
      default: 0,
      min: [0, 'Phí phạt trễ hạn không được âm']
    },
    damageFee: {
      type: Number,
      default: 0,
      min: [0, 'Phí hư hỏng không được âm']
    },
    rentalDays: {
      type: Number,
      min: 1,
      max: 7
    },
    rentalPricePerDay: {
      type: Number,
      min: 0
    },
    totalRentalPrice: {
      type: Number,
      min: 0
    },
    paymentId: {
      type: String,
      trim: true,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  },
  { timestamps: true }
);

// Compound indexes
borrowSchema.index({ user: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });
borrowSchema.index({ dueDate: 1, status: 1 });
borrowSchema.index({ user: 1, book: 1, status: 1 });
borrowSchema.index({ bookCopy: 1, status: 1 });
borrowSchema.index({ user: 1, borrowType: 1, borrowDate: 1 });
borrowSchema.index({ processedBy: 1, status: 1 });
borrowSchema.index({ processedBy: 1, createdAt: 1 });

// Virtual để tính số ngày trễ
borrowSchema.virtual('daysLate').get(function () {
  if (this.status === 'Returned' && this.returnDate) {
    return Math.max(
      0,
      Math.floor((this.returnDate.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );
  }
  if (this.status === 'Borrowed' || this.status === 'Overdue') {
    return Math.max(
      0,
      Math.floor((Date.now() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );
  }
  return 0;
});

// Pre-save middleware: tự động chuyển sang Overdue nếu quá hạn
borrowSchema.pre('save', function (next) {
  if (this.status === 'Borrowed' && this.dueDate < new Date() && !this.returnDate) {
    this.status = 'Overdue';
  }
  next();
});

// Method: kiểm tra có thể gia hạn không
borrowSchema.methods.canRenew = function () {
  return (
    this.status === 'Borrowed' &&
    this.renewalCount < this.maxRenewals &&
    this.dueDate >= new Date()
  );
};

export default mongoose.model<IBorrow>('Borrow', borrowSchema);
