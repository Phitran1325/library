import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'FAVORITE_BOOK_AVAILABLE'
  | 'SYSTEM'
  | 'BORROW_REMINDER'
  | 'OVERDUE_WARNING';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  deliveredChannels: NotificationChannel[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ['FAVORITE_BOOK_AVAILABLE', 'SYSTEM', 'BORROW_REMINDER', 'OVERDUE_WARNING'],
      default: 'SYSTEM'
    },
    data: {
      type: Schema.Types.Mixed
    },
    channels: {
      type: [
        {
          type: String,
          enum: ['IN_APP', 'EMAIL']
        }
      ],
      default: ['IN_APP']
    },
    deliveredChannels: {
      type: [
        {
          type: String,
          enum: ['IN_APP', 'EMAIL']
        }
      ],
      default: []
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

