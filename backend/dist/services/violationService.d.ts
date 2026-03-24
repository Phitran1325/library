import { ViolationType } from '../models/Violation';
/**
 * Ghi nhận vi phạm và kiểm tra có cần suspend không
 */
export declare function recordViolation(userId: string, type: ViolationType, borrowId: string, severity?: 'Low' | 'Medium' | 'High', description?: string): Promise<void>;
/**
 * Kiểm tra và tự động mở khóa user đã hết thời gian suspend
 */
export declare function checkAndAutoUnsuspend(): Promise<void>;
/**
 * Kiểm tra và tự động suspend user có sách quá hạn quá lâu
 */
export declare function checkAndAutoSuspendOverdue(): Promise<void>;
/**
 * Tự động khóa quyền mượn của độc giả nếu họ trễ hạn quá 30 ngày
 * Chỉ khóa canBorrow, không suspend toàn bộ tài khoản
 */
export declare function autoLockBorrowingPermissionForOverdue(): Promise<{
    totalChecked: number;
    totalLocked: number;
    lockedUsers: Array<{
        userId: string;
        email: string;
        fullName: string;
        maxDaysOverdue: number;
        overdueBorrows: number;
    }>;
}>;
/**
 * Tự động khóa quyền mượn khi độc giả có số tiền phạt vượt quá hạn mức cho phép
 * Tính tổng nợ phạt (lateFee + damageFee) từ tất cả các borrow chưa thanh toán
 */
export declare function autoLockBorrowingPermissionForPenaltyDebt(): Promise<{
    totalChecked: number;
    totalLocked: number;
    lockedUsers: Array<{
        userId: string;
        email: string;
        fullName: string;
        totalPenaltyDebt: number;
        maxPenaltyDebt: number;
        borrowsWithPenalty: number;
    }>;
}>;
//# sourceMappingURL=violationService.d.ts.map