"use strict";
/**
 * Constants cho quy định mượn sách theo từng loại thành viên
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAMAGE_FEES = exports.BOOK_CONDITION = exports.VIOLATION_RULES = exports.PREMIUM_MEMBER_RULES = exports.STANDARD_MEMBER_RULES = exports.MembershipType = void 0;
exports.normalizeBookCondition = normalizeBookCondition;
exports.calculateDamageFeeByCondition = calculateDamageFeeByCondition;
exports.isDamagedCondition = isDamagedCondition;
exports.isLostCondition = isLostCondition;
exports.getBorrowingRules = getBorrowingRules;
exports.getDaysDifference = getDaysDifference;
exports.addDays = addDays;
var MembershipType;
(function (MembershipType) {
    MembershipType["STANDARD"] = "Standard";
    MembershipType["PREMIUM"] = "Premium";
})(MembershipType || (exports.MembershipType = MembershipType = {}));
// Quy định cho Thành viên Thường
exports.STANDARD_MEMBER_RULES = {
    maxConcurrentBorrows: 5, // Số sách mượn đồng thời tối đa
    borrowDurationDays: 14, // Thời hạn mượn (ngày)
    maxRenewals: 2, // Số lần gia hạn tối đa
    renewalDurationDays: 7, // Thời gian gia hạn mỗi lần (ngày)
    lateFeePerDay: 10000, // Phí phạt trễ hạn mỗi ngày (VNĐ)
    firstTimeLateFeeWaiver: false, // Miễn phí lần trễ đầu
    firstTimeLateFeeWaiverDays: 0, // Số ngày được miễn phí nếu áp dụng
    maxReservations: 5, // Số lượt đặt trước tối đa
    reservationHoldHours: 72, // Thời gian giữ đặt trước (giờ)
    canBorrowPremium: true, // Có thể mượn sách Premium
    premiumBookExtraFee: 0 // Phí bổ sung khi mượn sách Premium
};
// Quy định cho Thành viên Premium
exports.PREMIUM_MEMBER_RULES = {
    maxConcurrentBorrows: 5, // Giữ lại để tương thích, giá trị trùng với gói hiện tại
    borrowDurationDays: 14,
    maxRenewals: 2,
    renewalDurationDays: 7,
    lateFeePerDay: 3000,
    firstTimeLateFeeWaiver: true, // Miễn phí lần trễ đầu trong giới hạn ngày
    firstTimeLateFeeWaiverDays: 3,
    maxReservations: 5,
    reservationHoldHours: 72,
    canBorrowPremium: true,
    premiumBookExtraFee: 0,
    reservationPriority: 1
};
// Quy định chung cho vi phạm
exports.VIOLATION_RULES = {
    maxOverdueDays: 30, // Số ngày trễ tối đa trước khi khóa tài khoản
    maxViolationsInMonths: 3, // Số lần vi phạm trong khoảng thời gian
    violationTrackingMonths: 3, // Khoảng thời gian theo dõi vi phạm (tháng)
    suspensionDaysAfterMaxViolations: 7, // Số ngày khóa tài khoản sau khi vi phạm quá nhiều
    autoSuspendAfterDays: 60, // Tự động suspend nếu không xử lý sau (ngày)
    maxPenaltyDebt: 500000 // Hạn mức nợ phạt tối đa (VNĐ) - 500,000 VNĐ
};
// Trạng thái sách khi trả
exports.BOOK_CONDITION = {
    GOOD: 'Good', // Bình thường
    DAMAGED: 'Damaged', // Hư hỏng nhẹ
    SEVERELY_DAMAGED: 'SeverelyDamaged', // Hư hỏng nặng
    LOST: 'Lost' // Mất
};
// Phí hư hỏng sách (tỷ lệ % giá sách)
exports.DAMAGE_FEES = {
    DAMAGED: 0.2, // 20% giá sách
    SEVERELY_DAMAGED: 0.5, // 50% giá sách
    LOST: 1.0 // 100% giá sách (phải mua lại)
};
const DAMAGE_RATE_BY_CONDITION = {
    [exports.BOOK_CONDITION.GOOD]: 0,
    [exports.BOOK_CONDITION.DAMAGED]: exports.DAMAGE_FEES.DAMAGED,
    [exports.BOOK_CONDITION.SEVERELY_DAMAGED]: exports.DAMAGE_FEES.SEVERELY_DAMAGED,
    [exports.BOOK_CONDITION.LOST]: exports.DAMAGE_FEES.LOST
};
function normalizeBookCondition(condition) {
    if (!condition || typeof condition !== 'string') {
        return exports.BOOK_CONDITION.GOOD;
    }
    const normalizedValue = condition.trim().toLowerCase();
    const matched = Object.values(exports.BOOK_CONDITION).find((value) => value.toLowerCase() === normalizedValue);
    return matched || exports.BOOK_CONDITION.GOOD;
}
function calculateDamageFeeByCondition(condition, bookPrice) {
    const price = typeof bookPrice === 'number' && !Number.isNaN(bookPrice) && bookPrice > 0
        ? bookPrice
        : 0;
    if (price === 0) {
        return 0;
    }
    const rate = DAMAGE_RATE_BY_CONDITION[condition] ?? 0;
    if (rate === 0) {
        return 0;
    }
    return Math.round(price * rate);
}
function isDamagedCondition(condition) {
    return (condition === exports.BOOK_CONDITION.DAMAGED ||
        condition === exports.BOOK_CONDITION.SEVERELY_DAMAGED);
}
function isLostCondition(condition) {
    return condition === exports.BOOK_CONDITION.LOST;
}
/**
 * Lấy quy định theo loại thành viên
 */
function getBorrowingRules(membershipType) {
    const normalized = (membershipType || '').toLowerCase();
    if (membershipType === MembershipType.PREMIUM ||
        normalized === 'premium' ||
        normalized.includes('premium')) {
        return exports.PREMIUM_MEMBER_RULES;
    }
    // Mặc định Standard nếu không khớp Premium
    return exports.STANDARD_MEMBER_RULES;
}
/**
 * Tính số ngày giữa hai ngày
 */
function getDaysDifference(startDate, endDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Thêm ngày vào một ngày
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
//# sourceMappingURL=borrowingConstants.js.map