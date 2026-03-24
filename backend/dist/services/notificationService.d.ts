import { NotificationChannel, NotificationType } from '../models/Notification';
interface NotificationEmailOptions {
    subject?: string;
    actionUrl?: string;
    actionLabel?: string;
    footerNote?: string;
}
export interface NotificationPayload {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    data?: Record<string, any>;
    channels?: NotificationChannel[];
    emailOptions?: NotificationEmailOptions;
}
export declare function createNotification(payload: NotificationPayload): Promise<(import("mongoose").Document<unknown, {}, import("../models/Notification").INotification, {}, {}> & import("../models/Notification").INotification & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function createBulkNotifications(payloads: NotificationPayload[]): Promise<import("mongoose").MergeType<import("mongoose").Document<unknown, {}, import("../models/Notification").INotification, {}, {}> & import("../models/Notification").INotification & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, Omit<{
    user: string;
    title: string;
    message: string;
    type: NotificationType;
    data?: Record<string, any>;
    channels: NotificationChannel[];
    deliveredChannels: NotificationChannel[];
}, "_id">>[]>;
export declare function markNotificationAsRead(userId: string, notificationId: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/Notification").INotification, {}, {}> & import("../models/Notification").INotification & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function markAllNotificationsAsRead(userId: string): Promise<number>;
export {};
//# sourceMappingURL=notificationService.d.ts.map