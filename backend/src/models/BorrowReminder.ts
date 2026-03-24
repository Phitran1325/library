import mongoose, { Document, Schema } from 'mongoose';

export type ReminderType = 'BEFORE_DUE' | 'OVERDUE' | 'MANUAL';
export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface IBorrowReminder extends Document {
  borrow: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: ReminderType;
  status: ReminderStatus;
  scheduledDate: Date; // Ngày dự kiến gửi
  sentAt?: Date; // Ngày thực tế gửi
  daysUntilDue?: number; // Số ngày còn lại đến hạn (cho BEFORE_DUE)
  daysOverdue?: number; // Số ngày quá hạn (cho OVERDUE)
  emailSent: boolean;
  notificationSent: boolean;
  websocketSent: boolean;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

const borrowReminderSchema = new Schema<IBorrowReminder>(
  {
    borrow: {
      type: Schema.Types.ObjectId,
      ref: 'Borrow',
      required: [true, 'Phiếu mượn là bắt buộc'],
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc'],
      index: true
    },
    type: {
      type: String,
      enum: ['BEFORE_DUE', 'OVERDUE', 'MANUAL'],
      required: [true, 'Loại nhắc nhở là bắt buộc'],
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Ngày dự kiến gửi là bắt buộc'],
      index: true
    },
    sentAt: {
      type: Date
    },
    daysUntilDue: {
      type: Number,
      min: [0, 'Số ngày còn lại không được âm']
    },
    daysOverdue: {
      type: Number,
      min: [0, 'Số ngày quá hạn không được âm']
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    websocketSent: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      maxlength: [500, 'Thông báo lỗi không được vượt quá 500 ký tự']
    },
    retryCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lần thử lại không được âm']
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: [0, 'Số lần thử lại tối đa không được âm'],
      max: [10, 'Số lần thử lại tối đa không được vượt quá 10']
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes để tối ưu query
borrowReminderSchema.index({ borrow: 1, type: 1, status: 1 });
borrowReminderSchema.index({ user: 1, status: 1, scheduledDate: 1 });
borrowReminderSchema.index({ scheduledDate: 1, status: 1 });
borrowReminderSchema.index({ type: 1, status: 1, scheduledDate: 1 });

// Index để tìm reminders cần gửi
borrowReminderSchema.index({ status: 1, scheduledDate: 1, type: 1 });

// Unique index để tránh gửi duplicate reminders cùng loại cho cùng một borrow
borrowReminderSchema.index(
  { borrow: 1, type: 1, scheduledDate: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: { $in: ['PENDING', 'SENT'] } }
  }
);

const BorrowReminder = mongoose.model<IBorrowReminder>('BorrowReminder', borrowReminderSchema);

export default BorrowReminder;

