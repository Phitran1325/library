import { ReminderType, ReminderStatus } from '../models/BorrowReminder';
import mongoose from 'mongoose';
interface ReminderConfig {
    beforeDueDays: number[];
    overdueInterval: number;
    maxRemindersPerBorrow: number;
}
/**
 * Tạo reminder record trong database
 */
export declare function createReminderRecord(borrowId: string, userId: string, type: ReminderType, scheduledDate: Date, daysUntilDue?: number, daysOverdue?: number): Promise<IBorrowReminder>;
/**
 * Gửi reminder (email + notification + websocket)
 */
export declare function sendReminder(reminderId: string): Promise<{
    success: boolean;
    emailSent: boolean;
    notificationSent: boolean;
    websocketSent: boolean;
    error?: string;
}>;
/**
 * Tạo reminders tự động cho các borrows sắp đến hạn
 */
export declare function scheduleBeforeDueReminders(config?: ReminderConfig): Promise<number>;
/**
 * Tạo reminders tự động cho các borrows quá hạn
 */
export declare function scheduleOverdueReminders(config?: ReminderConfig): Promise<number>;
/**
 * Gửi tất cả reminders đã đến lúc gửi
 */
export declare function processPendingReminders(): Promise<{
    processed: number;
    success: number;
    failed: number;
}>;
/**
 * Gửi reminder thủ công (từ librarian/admin)
 */
export declare function sendManualReminder(borrowId: string, customMessage?: string): Promise<{
    success: boolean;
    reminderId: string;
    emailSent: boolean;
    notificationSent: boolean;
    websocketSent: boolean;
}>;
export interface IBorrowReminder {
    _id: mongoose.Types.ObjectId;
    borrow: mongoose.Types.ObjectId | any;
    user: mongoose.Types.ObjectId | any;
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
}
export {};
//# sourceMappingURL=reminderService.d.ts.map