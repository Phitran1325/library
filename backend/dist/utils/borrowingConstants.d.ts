/**
 * Constants cho quy định mượn sách theo từng loại thành viên
 */
export declare enum MembershipType {
    STANDARD = "Standard",
    PREMIUM = "Premium"
}
export declare const STANDARD_MEMBER_RULES: {
    readonly maxConcurrentBorrows: 5;
    readonly borrowDurationDays: 14;
    readonly maxRenewals: 2;
    readonly renewalDurationDays: 7;
    readonly lateFeePerDay: 10000;
    readonly firstTimeLateFeeWaiver: false;
    readonly firstTimeLateFeeWaiverDays: 0;
    readonly maxReservations: 5;
    readonly reservationHoldHours: 72;
    readonly canBorrowPremium: true;
    readonly premiumBookExtraFee: 0;
};
export declare const PREMIUM_MEMBER_RULES: {
    readonly maxConcurrentBorrows: 5;
    readonly borrowDurationDays: 14;
    readonly maxRenewals: 2;
    readonly renewalDurationDays: 7;
    readonly lateFeePerDay: 3000;
    readonly firstTimeLateFeeWaiver: true;
    readonly firstTimeLateFeeWaiverDays: 3;
    readonly maxReservations: 5;
    readonly reservationHoldHours: 72;
    readonly canBorrowPremium: true;
    readonly premiumBookExtraFee: 0;
    readonly reservationPriority: 1;
};
export declare const VIOLATION_RULES: {
    readonly maxOverdueDays: 30;
    readonly maxViolationsInMonths: 3;
    readonly violationTrackingMonths: 3;
    readonly suspensionDaysAfterMaxViolations: 7;
    readonly autoSuspendAfterDays: 60;
    readonly maxPenaltyDebt: 500000;
};
export declare const BOOK_CONDITION: {
    readonly GOOD: "Good";
    readonly DAMAGED: "Damaged";
    readonly SEVERELY_DAMAGED: "SeverelyDamaged";
    readonly LOST: "Lost";
};
export type BookCondition = (typeof BOOK_CONDITION)[keyof typeof BOOK_CONDITION];
export declare const DAMAGE_FEES: {
    readonly DAMAGED: 0.2;
    readonly SEVERELY_DAMAGED: 0.5;
    readonly LOST: 1;
};
export declare function normalizeBookCondition(condition?: string | null): BookCondition;
export declare function calculateDamageFeeByCondition(condition: BookCondition, bookPrice?: number | null): number;
export declare function isDamagedCondition(condition: BookCondition): boolean;
export declare function isLostCondition(condition: BookCondition): boolean;
/**
 * Lấy quy định theo loại thành viên
 */
export declare function getBorrowingRules(membershipType: string | undefined | null): {
    readonly maxConcurrentBorrows: 5;
    readonly borrowDurationDays: 14;
    readonly maxRenewals: 2;
    readonly renewalDurationDays: 7;
    readonly lateFeePerDay: 10000;
    readonly firstTimeLateFeeWaiver: false;
    readonly firstTimeLateFeeWaiverDays: 0;
    readonly maxReservations: 5;
    readonly reservationHoldHours: 72;
    readonly canBorrowPremium: true;
    readonly premiumBookExtraFee: 0;
} | {
    readonly maxConcurrentBorrows: 5;
    readonly borrowDurationDays: 14;
    readonly maxRenewals: 2;
    readonly renewalDurationDays: 7;
    readonly lateFeePerDay: 3000;
    readonly firstTimeLateFeeWaiver: true;
    readonly firstTimeLateFeeWaiverDays: 3;
    readonly maxReservations: 5;
    readonly reservationHoldHours: 72;
    readonly canBorrowPremium: true;
    readonly premiumBookExtraFee: 0;
    readonly reservationPriority: 1;
};
/**
 * Tính số ngày giữa hai ngày
 */
export declare function getDaysDifference(startDate: Date, endDate: Date): number;
/**
 * Thêm ngày vào một ngày
 */
export declare function addDays(date: Date, days: number): Date;
//# sourceMappingURL=borrowingConstants.d.ts.map