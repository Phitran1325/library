/**
 * Constants cho quy định mượn sách theo từng loại thành viên
 */

export enum MembershipType {
  STANDARD = 'Standard',
  PREMIUM = 'Premium'
}

// Quy định cho Thành viên Thường
export const STANDARD_MEMBER_RULES = {
  maxConcurrentBorrows: 5,            // Số sách mượn đồng thời tối đa
  borrowDurationDays: 14,             // Thời hạn mượn (ngày)
  maxRenewals: 2,                     // Số lần gia hạn tối đa
  renewalDurationDays: 7,             // Thời gian gia hạn mỗi lần (ngày)
  lateFeePerDay: 10000,               // Phí phạt trễ hạn mỗi ngày (VNĐ)
  firstTimeLateFeeWaiver: false,      // Miễn phí lần trễ đầu
  firstTimeLateFeeWaiverDays: 0,      // Số ngày được miễn phí nếu áp dụng
  maxReservations: 5,                 // Số lượt đặt trước tối đa
  reservationHoldHours: 72,           // Thời gian giữ đặt trước (giờ)
  canBorrowPremium: true,             // Có thể mượn sách Premium
  premiumBookExtraFee: 0              // Phí bổ sung khi mượn sách Premium
} as const;

// Quy định cho Thành viên Premium
export const PREMIUM_MEMBER_RULES = {
  maxConcurrentBorrows: 5,            // Giữ lại để tương thích, giá trị trùng với gói hiện tại
  borrowDurationDays: 14,
  maxRenewals: 2,
  renewalDurationDays: 7,
  lateFeePerDay: 3000,
  firstTimeLateFeeWaiver: true,       // Miễn phí lần trễ đầu trong giới hạn ngày
  firstTimeLateFeeWaiverDays: 3,
  maxReservations: 5,
  reservationHoldHours: 72,
  canBorrowPremium: true,
  premiumBookExtraFee: 0,
  reservationPriority: 1
} as const;

// Quy định chung cho vi phạm
export const VIOLATION_RULES = {
  maxOverdueDays: 30,                // Số ngày trễ tối đa trước khi khóa tài khoản
  maxViolationsInMonths: 3,           // Số lần vi phạm trong khoảng thời gian
  violationTrackingMonths: 3,         // Khoảng thời gian theo dõi vi phạm (tháng)
  suspensionDaysAfterMaxViolations: 7, // Số ngày khóa tài khoản sau khi vi phạm quá nhiều
  autoSuspendAfterDays: 60,           // Tự động suspend nếu không xử lý sau (ngày)
  maxPenaltyDebt: 500000             // Hạn mức nợ phạt tối đa (VNĐ) - 500,000 VNĐ
} as const;

// Trạng thái sách khi trả
export const BOOK_CONDITION = {
  GOOD: 'Good',           // Bình thường
  DAMAGED: 'Damaged',     // Hư hỏng nhẹ
  SEVERELY_DAMAGED: 'SeverelyDamaged', // Hư hỏng nặng
  LOST: 'Lost'            // Mất
} as const;

export type BookCondition = (typeof BOOK_CONDITION)[keyof typeof BOOK_CONDITION];

// Phí hư hỏng sách (tỷ lệ % giá sách)
export const DAMAGE_FEES = {
  DAMAGED: 0.2,              // 20% giá sách
  SEVERELY_DAMAGED: 0.5,     // 50% giá sách
  LOST: 1.0                  // 100% giá sách (phải mua lại)
} as const;

const DAMAGE_RATE_BY_CONDITION: Record<BookCondition, number> = {
  [BOOK_CONDITION.GOOD]: 0,
  [BOOK_CONDITION.DAMAGED]: DAMAGE_FEES.DAMAGED,
  [BOOK_CONDITION.SEVERELY_DAMAGED]: DAMAGE_FEES.SEVERELY_DAMAGED,
  [BOOK_CONDITION.LOST]: DAMAGE_FEES.LOST
};

export function normalizeBookCondition(condition?: string | null): BookCondition {
  if (!condition || typeof condition !== 'string') {
    return BOOK_CONDITION.GOOD;
  }

  const normalizedValue = condition.trim().toLowerCase();
  const matched = (Object.values(BOOK_CONDITION) as string[]).find(
    (value) => value.toLowerCase() === normalizedValue
  );

  return (matched as BookCondition) || BOOK_CONDITION.GOOD;
}

export function calculateDamageFeeByCondition(
  condition: BookCondition,
  bookPrice?: number | null
): number {
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

export function isDamagedCondition(condition: BookCondition): boolean {
  return (
    condition === BOOK_CONDITION.DAMAGED ||
    condition === BOOK_CONDITION.SEVERELY_DAMAGED
  );
}

export function isLostCondition(condition: BookCondition): boolean {
  return condition === BOOK_CONDITION.LOST;
}

/**
 * Lấy quy định theo loại thành viên
 */
export function getBorrowingRules(membershipType: string | undefined | null) {
  const normalized = (membershipType || '').toLowerCase();
  if (
    membershipType === MembershipType.PREMIUM ||
    normalized === 'premium' ||
    normalized.includes('premium')
  ) {
    return PREMIUM_MEMBER_RULES;
  }
  // Mặc định Standard nếu không khớp Premium
  return STANDARD_MEMBER_RULES;
}

/**
 * Tính số ngày giữa hai ngày
 */
export function getDaysDifference(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Thêm ngày vào một ngày
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

