import mongoose, { Document } from 'mongoose';
export type ReminderType = 'BEFORE_DUE' | 'OVERDUE' | 'MANUAL';
export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED';
export interface IBorrowReminder extends Document {
    borrow: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    type: ReminderType;
    status: ReminderStatus;
    scheduledDate: Date;
    sentAt?: Date;
    daysUntilDue?: number;
    daysOverdue?: number;
    emailSent: boolean;
    notificationSent: boolean;
    websocketSent: boolean;
    errorMessage?: string;
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const BorrowReminder: mongoose.Model<IBorrowReminder, {}, {}, {}, mongoose.Document<unknown, {}, IBorrowReminder, {}, {}> & IBorrowReminder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default BorrowReminder;
//# sourceMappingURL=BorrowReminder.d.ts.map