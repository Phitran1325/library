export declare const sendVerificationOTP: (email: string, otpCode: string) => Promise<void>;
export declare const sendPasswordResetOTP: (email: string, otpCode: string) => Promise<void>;
/**
 * Gửi email thông báo mượn sách thành công
 */
export declare const sendBorrowSuccessEmail: (borrowId: string) => Promise<void>;
/**
 * Gửi email nhắc nhở trước hạn trả sách
 */
export declare const sendDueDateReminderEmail: (borrowId: string, daysUntilDue: number) => Promise<void>;
/**
 * Gửi email cảnh báo quá hạn
 */
export declare const sendOverdueWarningEmail: (borrowId: string, daysOverdue: number, lateFee: number) => Promise<void>;
/**
 * Gửi email khi sách được tự động mượn từ reservation
 */
export declare const sendAutoBorrowEmail: (userId: string, bookId: string) => Promise<void>;
/**
 * Gửi email từ chối yêu cầu đặt/mượn sách
 */
export declare const sendReservationRejectedEmail: (email: string, bookTitle: string, reason: string) => Promise<void>;
/**
 * Gửi email nhắc nhở thủ công từ thủ thư
 * - Nếu sách chưa đến hạn: gửi nhắc nhở trước hạn
 * - Nếu sách đã quá hạn: gửi cảnh báo kèm thông tin phí phạt hiện tại
 */
export declare const sendManualReminderEmail: (borrowId: string, customMessage?: string) => Promise<{
    borrowId: any;
    userEmail: any;
    isOverdue: boolean;
    daysDifference: number;
}>;
interface GenericNotificationEmailOptions {
    subject?: string;
    title?: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    footerNote?: string;
}
export declare const sendGenericNotificationEmail: (email: string, options: GenericNotificationEmailOptions) => Promise<void>;
export {};
//# sourceMappingURL=emailService.d.ts.map