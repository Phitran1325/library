/**
 * Cron job chạy hàng ngày lúc 00:00 để:
 * 1. Cập nhật phí phạt trễ hạn
 * 2. Gửi email nhắc nhở trước hạn
 * 3. Gửi email cảnh báo quá hạn
 * 4. Tự động chuyển trạng thái sang Lost nếu quá hạn 30 ngày
 * 5. Tự động suspend user vi phạm
 * 6. Tự động mở khóa user đã hết thời gian suspend
 * 7. Expire reservations hết hạn
 */
export declare function startBorrowCronJobs(): void;
/**
 * Gửi email nhắc nhở trước khi đến hạn (3 ngày và 1 ngày trước)
 */
export declare function sendDueDateReminders(): Promise<void>;
//# sourceMappingURL=borrowCronJobs.d.ts.map