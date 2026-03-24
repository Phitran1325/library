import { IBorrow } from '../models/Borrow';
export interface BorrowValidationResult {
    isValid: boolean;
    errors: string[];
}
export interface BorrowingInfo {
    currentBorrows: number;
    maxBorrows: number;
    membershipType: string;
    canBorrow: boolean;
}
/**
 * Kiểm tra quyền mượn sách của user
 */
export declare function validateBorrowingPermission(userId: string, bookId: string): Promise<BorrowValidationResult>;
/**
 * Kiểm tra điều kiện mượn lẻ (Rental) - không cần membership
 */
export declare function validateRentalPermission(userId: string, bookId: string, rentalDays: number): Promise<BorrowValidationResult>;
/**
 * Lấy thông tin mượn sách của user
 */
export declare function getBorrowingInfo(userId: string): Promise<BorrowingInfo>;
/**
 * Tính ngày hết hạn dựa trên loại thành viên
 */
export declare function calculateDueDate(borrowDate: Date, membershipType: string): Date;
/**
 * Tính phí phạt trễ hạn
 */
export declare function calculateLateFee(dueDate: Date, returnDate: Date, membershipType: string, isFirstTimeLate?: boolean): number;
/**
 * Kiểm tra có thể gia hạn không
 */
export declare function canRenewBorrow(borrowId: string, userId: string): Promise<{
    canRenew: boolean;
    reason?: string;
}>;
/**
 * Tính ngày hết hạn mới sau khi gia hạn
 */
export declare function calculateNewDueDate(currentDueDate: Date, membershipType: string): Date;
/**
 * Tạo phiếu mượn theo membership (giữ nguyên yêu cầu membership, đảm bảo atomicity bằng transaction)
 */
export declare function createBorrow(userId: string, bookId: string): Promise<IBorrow>;
/**
 * Tạo phiếu mượn lẻ (Rental) sau khi đã thanh toán thành công
 */
export declare function createRentalBorrow(userId: string, bookId: string, paymentIdentifier: string, // Có thể là paymentId hoặc providerRef
rentalDays: number): Promise<IBorrow>;
/**
 * Trả sách (với transaction để đảm bảo atomicity)
 * Chỉ Admin/Librarian mới có quyền trả sách
 */
export declare function returnBook(borrowId: string, staffUserId: string, staffRole: string, bookCondition?: string, notes?: string): Promise<IBorrow>;
/**
 * Gia hạn mượn sách
 */
export declare function renewBorrow(borrowId: string, userId: string): Promise<IBorrow>;
/**
 * Tạo payment link cho mượn lẻ
 */
export declare function createRentalPaymentLink(userId: string, bookId: string, rentalDays: number): Promise<{
    provider: string;
    paymentId: string | undefined;
    providerRef: string;
    checkoutUrl: string;
    expiresAt: Date;
    amount: number;
    rentalDays: number;
}>;
/**
 * Tính phạt trễ hạn tự động cho tất cả sách quá hạn
 * Hàm này được gọi bởi cron job hoặc API endpoint
 */
export declare function calculateLateFeesAutomatically(): Promise<{
    totalProcessed: number;
    totalUpdated: number;
    totalLateFee: number;
    details: Array<{
        borrowId: string;
        userId: string;
        bookId: string;
        daysLate: number;
        lateFee: number;
        updated: boolean;
    }>;
}>;
//# sourceMappingURL=borrowService.d.ts.map