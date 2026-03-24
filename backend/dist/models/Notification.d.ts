import mongoose, { Document } from 'mongoose';
export type NotificationType = 'FAVORITE_BOOK_AVAILABLE' | 'SYSTEM' | 'BORROW_REMINDER' | 'OVERDUE_WARNING';
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
declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Notification;
//# sourceMappingURL=Notification.d.ts.map