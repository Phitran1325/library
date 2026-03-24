import mongoose from 'mongoose';
import Borrow, { IBorrow, BorrowStatus } from '../models/Borrow';
import Book, { IBook } from '../models/Book';
import BookCopy from '../models/BookCopy';
import User from '../models/User';
import MembershipPlan from '../models/MembershipPlan';
import Reservation from '../models/Reservation';
import Payment from '../models/Payment';
import {
  getBorrowingRules,
  addDays,
  getDaysDifference,
  STANDARD_MEMBER_RULES,
  PREMIUM_MEMBER_RULES,
  MembershipType,
  VIOLATION_RULES,
  BOOK_CONDITION,
  BookCondition,
  calculateDamageFeeByCondition,
  normalizeBookCondition,
  isDamagedCondition,
  isLostCondition
} from '../utils/borrowingConstants';
import { sendBorrowSuccessEmail, sendAutoBorrowEmail, sendReservationNotificationEmail } from './emailService';
import { createPayOSPaymentLink } from './payment/payosService';
import { calculateTotalDebt, MAX_DEBT_ALLOWED } from './debtService';
import { recordViolation } from './violationService';
import {
  markFavoritesWaitingForAvailability,
  notifyFavoriteReadersIfBookAvailable
} from './favoriteNotificationService';
import { assignNextReservation } from './reservationService';

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
 * Helper function to find book by _id or slug
 */
async function findBookByIdOrSlug(identifier: string, session?: mongoose.ClientSession): Promise<IBook | null> {
  // Try to find by _id first (if it's a valid ObjectId)
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const query = Book.findById(identifier);
    if (session) query.session(session);
    const bookById = await query;
    if (bookById) return bookById;
  }
  
  // If not found by _id, try to find by slug
  const query = Book.findOne({ slug: identifier });
  if (session) query.session(session);
  const bookBySlug = await query;
  return bookBySlug;
}

/**
 * Kiểm tra quyền mượn sách của user
 */
export async function validateBorrowingPermission(
  userId: string,
  bookId: string
): Promise<BorrowValidationResult> {
  const errors: string[] = [];

  // 1. Kiểm tra user tồn tại và có quyền mượn
  const user = await User.findById(userId).populate('membershipPlanId');
  if (!user) {
    errors.push('Người dùng không tồn tại');
    return { isValid: false, errors };
  }

  // 2. Kiểm tra trạng thái tài khoản
  if (user.status !== 'Active') {
    errors.push(`Tài khoản đang ở trạng thái: ${user.status}`);
  }

  if (!user.isActive) {
    errors.push('Tài khoản đã bị vô hiệu hóa');
  }

  if (!user.canBorrow) {
    errors.push('Tài khoản đã bị khóa quyền mượn sách');
  }

  // 2.1. Kiểm tra người dùng có sách trả trễ hạn không
  // Kiểm tra cả sách có status là 'Overdue' và sách 'Borrowed' nhưng đã quá hạn
  const now = new Date();
  const overdueBorrows = await Borrow.find({
    user: userId,
    $or: [
      { status: 'Overdue' },
      { 
        status: 'Borrowed',
        dueDate: { $lt: now }
      }
    ]
  });

  if (overdueBorrows.length > 0) {
    errors.push('Bạn có sách trả trễ hạn. Vui lòng trả sách trước khi mượn thêm.');
  }

  // 3. Kiểm tra gói thành viên
  if (!user.membershipPlanId) {
    errors.push('Bạn chưa đăng ký gói thành viên');
    return { isValid: false, errors };
  }

  const membershipPlan = user.membershipPlanId as any;
  if (!membershipPlan.isActive) {
    errors.push('Gói thành viên đã hết hạn hoặc bị vô hiệu hóa');
  }

  // 3.1. Kiểm tra gói thành viên còn hiệu lực (chưa hết hạn)
  if (user.membershipEndDate && user.membershipEndDate < new Date()) {
    errors.push('Gói thành viên của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục mượn sách.');
    return { isValid: false, errors };
  }

  // Nếu chưa có endDate, kiểm tra dựa trên startDate + duration
  if (!user.membershipEndDate && user.membershipStartDate && membershipPlan.duration) {
    const calculatedEndDate = new Date(user.membershipStartDate);
    calculatedEndDate.setMonth(calculatedEndDate.getMonth() + membershipPlan.duration);
    
    if (calculatedEndDate < new Date()) {
      errors.push('Gói thành viên của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục mượn sách.');
      return { isValid: false, errors };
    }
  }

  // 4. Kiểm tra số sách đang mượn
  const membershipType = membershipPlan.name || MembershipType.STANDARD;
  const rules = getBorrowingRules(membershipType);
  
  const currentBorrows = await Borrow.countDocuments({
    user: userId,
    status: { $in: ['Borrowed', 'Overdue'] }
  });

  if (currentBorrows >= rules.maxConcurrentBorrows) {
    errors.push(
      `Bạn đã mượn tối đa ${rules.maxConcurrentBorrows} cuốn sách. Vui lòng trả sách trước khi mượn thêm.`
    );
  }

  // 4.1. Kiểm soát lượt mượn theo tháng (dựa trên MembershipPlan.maxBorrows)
  // Premium: maxBorrows = 0 -> không giới hạn
  if (typeof membershipPlan.maxBorrows === 'number' && membershipPlan.maxBorrows > 0) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthlyBorrowCount = await Borrow.countDocuments({
      user: userId,
      borrowDate: { $gte: monthStart, $lte: now }
    });

    if (monthlyBorrowCount >= membershipPlan.maxBorrows) {
      errors.push(`Bạn đã đạt ${membershipPlan.maxBorrows} lượt mượn trong tháng này. Vui lòng đợi sang tháng sau để tiếp tục mượn.`);
    }
  }

  // 5. Kiểm tra sách tồn tại và có sẵn
  const book = await findBookByIdOrSlug(bookId);
  if (!book) {
    errors.push('Sách không tồn tại');
    return { isValid: false, errors };
  }

  if (!book.isActive || book.status !== 'available') {
    errors.push('Sách không có sẵn để mượn');
  }

  if (book.available <= 0) {
    errors.push('Sách đã được mượn hết, vui lòng đặt trước');
  }

  // 6. Kiểm tra sách Premium
  if (book.isPremium && !rules.canBorrowPremium && rules.premiumBookExtraFee === 0) {
    errors.push('Sách này chỉ dành cho thành viên Premium');
  }

  // 7. Kiểm tra đã mượn sách này chưa (đang mượn)
  const existingBorrow = await Borrow.findOne({
    user: userId,
    book: bookId,
    status: { $in: ['Borrowed', 'Overdue'] }
  });

  if (existingBorrow) {
    errors.push('Bạn đang mượn cuốn sách này');
  }

  // 8. Kiểm tra nợ phí phạt quá lớn
  const totalOverdue = await Borrow.aggregate([
    {
      $match: {
        user: user._id,
        status: { $in: ['Overdue', 'Borrowed'] },
        dueDate: { $lt: new Date() }
      }
    },
    {
      $group: {
        _id: null,
        totalLateFee: { $sum: '$lateFee' },
        maxDaysLate: {
          $max: {
            $divide: [
              { $subtract: [new Date(), '$dueDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    }
  ]);

  if (totalOverdue.length > 0) {
    const { totalLateFee, maxDaysLate } = totalOverdue[0];
    if (maxDaysLate > VIOLATION_RULES.maxOverdueDays) {
      errors.push(`Bạn có sách trễ hạn quá ${VIOLATION_RULES.maxOverdueDays} ngày. Vui lòng trả sách và thanh toán phí phạt.`);
    }
  }

  // 9. Kiểm tra nợ phí phạt
  const totalDebt = await calculateTotalDebt(userId);
  if (totalDebt > MAX_DEBT_ALLOWED) {
    errors.push(
      `Bạn có nợ phí phạt ${totalDebt.toLocaleString('vi-VN')} VNĐ. ` +
      `Vui lòng thanh toán để tiếp tục mượn sách.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Kiểm tra điều kiện mượn lẻ (Rental) - không cần membership
 */
export async function validateRentalPermission(
  userId: string,
  bookId: string,
  rentalDays: number
): Promise<BorrowValidationResult> {
  const errors: string[] = [];
  const now = new Date();

  const user = await User.findById(userId);
  if (!user) {
    errors.push('Người dùng không tồn tại');
    return { isValid: false, errors };
  }

  if (user.status !== 'Active') {
    errors.push(`Tài khoản đang ở trạng thái: ${user.status}`);
  }
  if (!user.isActive) {
    errors.push('Tài khoản đã bị vô hiệu hóa');
  }
  if (!user.canBorrow) {
    errors.push('Tài khoản đã bị khóa quyền mượn sách');
  }

  // Kiểm tra người dùng có sách trả trễ hạn không
  // Kiểm tra cả sách có status là 'Overdue' và sách 'Borrowed' nhưng đã quá hạn
  const overdueBorrows = await Borrow.find({
    user: userId,
    $or: [
      { status: 'Overdue' },
      { 
        status: 'Borrowed',
        dueDate: { $lt: new Date() }
      }
    ]
  });

  if (overdueBorrows.length > 0) {
    errors.push('Bạn có sách trả trễ hạn. Vui lòng trả sách trước khi mượn thêm.');
  }

  const book = await findBookByIdOrSlug(bookId);
  if (!book) {
    errors.push('Sách không tồn tại');
    return { isValid: false, errors };
  }
  if (!book.isActive || book.status !== 'available') {
    errors.push('Sách không có sẵn để mượn');
  }
  if (book.available <= 0) {
    errors.push('Sách đã được mượn hết, vui lòng đặt trước');
  }

  if (!Number.isInteger(rentalDays) || rentalDays < 1 || rentalDays > 7) {
    errors.push('Số ngày thuê phải từ 1 đến 7');
  }

  // Không cho mượn trùng cùng sách nếu đang mượn
  const existingBorrow = await Borrow.findOne({
    user: userId,
    book: bookId,
    status: { $in: ['Borrowed', 'Overdue'] }
  });
  if (existingBorrow) {
    errors.push('Bạn đang mượn cuốn sách này');
  }

  // Giới hạn 5 lượt mượn lẻ/tháng (tính mọi trạng thái trong tháng)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthlyRentalCount = await Borrow.countDocuments({
    user: userId,
    borrowType: 'Rental',
    borrowDate: { $gte: monthStart, $lte: now }
  });
  if (monthlyRentalCount >= 5) {
    errors.push('Bạn đã đạt tối đa 5 lượt mượn lẻ trong tháng này');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Lấy thông tin mượn sách của user
 */
export async function getBorrowingInfo(userId: string): Promise<BorrowingInfo> {
  const user = await User.findById(userId).populate('membershipPlanId');
  
  if (!user) {
    return {
      currentBorrows: 0,
      maxBorrows: 0,
      membershipType: MembershipType.STANDARD,
      canBorrow: false
    };
  }

  // Kiểm tra quyền cơ bản
  const hasBasicPermission = user.canBorrow && user.status === 'Active' && user.isActive;

  // Nếu không có membership, vẫn cho phép mượn lẻ (Rental)
  if (!user.membershipPlanId) {
    const currentBorrows = await Borrow.countDocuments({
      user: userId,
      status: { $in: ['Borrowed', 'Overdue'] }
    });

    return {
      currentBorrows,
      maxBorrows: 0, // Không có giới hạn mượn membership, chỉ có thể mượn lẻ
      membershipType: MembershipType.STANDARD,
      canBorrow: hasBasicPermission // Cho phép mượn lẻ nếu có quyền cơ bản
    };
  }

  // Có membership - áp dụng quy định membership
  const membershipPlan = user.membershipPlanId as any;
  const membershipType = membershipPlan.name || MembershipType.STANDARD;
  const rules = getBorrowingRules(membershipType);

  const currentBorrows = await Borrow.countDocuments({
    user: userId,
    status: { $in: ['Borrowed', 'Overdue'] }
  });

  return {
    currentBorrows,
    maxBorrows: rules.maxConcurrentBorrows,
    membershipType,
    canBorrow: hasBasicPermission
  };
}

/**
 * Tính ngày hết hạn dựa trên loại thành viên
 */
export function calculateDueDate(
  borrowDate: Date,
  membershipType: string
): Date {
  const rules = getBorrowingRules(membershipType);
  return addDays(borrowDate, rules.borrowDurationDays);
}

/**
 * Tính phí phạt trễ hạn
 */
export function calculateLateFee(
  dueDate: Date,
  returnDate: Date,
  membershipType: string,
  isFirstTimeLate: boolean = false
): number {
  const daysLate = getDaysDifference(dueDate, returnDate);
  
  if (daysLate <= 0) {
    return 0;
  }

  const rules = getBorrowingRules(membershipType);

  // Premium được miễn phí 3 ngày đầu nếu là lần trễ đầu tiên
  if (
    rules.firstTimeLateFeeWaiver &&
    isFirstTimeLate &&
    daysLate <= rules.firstTimeLateFeeWaiverDays
  ) {
    return 0;
  }

  return daysLate * rules.lateFeePerDay;
}

/**
 * Kiểm tra có thể gia hạn không
 */
export async function canRenewBorrow(
  borrowId: string,
  userId: string
): Promise<{ canRenew: boolean; reason?: string }> {
  const borrow = await Borrow.findById(borrowId).populate('book user');

  if (!borrow) {
    return { canRenew: false, reason: 'Phiếu mượn không tồn tại' };
  }

  // Kiểm tra quyền sở hữu: user có thể là ObjectId hoặc đã được populate
  const borrowUserId = (borrow.user as any)?._id 
    ? String((borrow.user as any)._id) 
    : String(borrow.user);
  
  if (borrowUserId !== userId) {
    return { canRenew: false, reason: 'Bạn không có quyền gia hạn phiếu mượn này' };
  }

  // Kiểm tra trạng thái
  if (borrow.status !== 'Borrowed') {
    return { canRenew: false, reason: 'Chỉ có thể gia hạn sách đang mượn' };
  }

  // Kiểm tra đã quá hạn chưa
  if (borrow.dueDate < new Date()) {
    return { canRenew: false, reason: 'Không thể gia hạn sách đã quá hạn' };
  }

  // Kiểm tra loại mượn - Rental không thể gia hạn
  if (borrow.borrowType === 'Rental') {
    return {
      canRenew: false,
      reason: 'Sách mượn lẻ (Rental) không thể gia hạn'
    };
  }

  // Kiểm tra số lần gia hạn
  if (borrow.renewalCount >= borrow.maxRenewals) {
    return {
      canRenew: false,
      reason: `Bạn đã gia hạn tối đa ${borrow.maxRenewals} lần`
    };
  }

  // Kiểm tra user status và nợ
  const user = borrow.user as any;
  if (user.status !== 'Active' || !user.canBorrow) {
    return { canRenew: false, reason: 'Tài khoản đã bị khóa quyền mượn sách' };
  }

  // Kiểm tra nợ phí phạt
  const totalDebt = await calculateTotalDebt(userId);
  if (totalDebt > MAX_DEBT_ALLOWED) {
    return {
      canRenew: false,
      reason: 'Vui lòng thanh toán nợ phí phạt trước khi gia hạn'
    };
  }

  // Kiểm tra sách có bị đặt trước không (chỉ của user khác và còn hiệu lực)
  const pendingReservationCount = await Reservation.countDocuments({
    book: borrow.book,
    status: 'Pending',
    expiresAt: { $gt: new Date() }, // Còn hiệu lực
    user: { $ne: userId } // Không phải của user này
  });

  if (pendingReservationCount > 0) {
    // Chỉ chặn gia hạn nếu không còn bản sao nào trống cho người đặt trước
    const book = borrow.book as any;
    const availableCopies =
      typeof book?.available === 'number'
        ? book.available
        : (await Book.findById(book?._id ?? book))?.available ?? 0;

    if (availableCopies <= 0) {
      return {
        canRenew: false,
        reason: 'Sách đã có người đặt trước và không còn bản sao trống, không thể gia hạn'
      };
    }
  }

  return { canRenew: true };
}

/**
 * Tính ngày hết hạn mới sau khi gia hạn
 */
export function calculateNewDueDate(
  currentDueDate: Date,
  membershipType: string
): Date {
  const rules = getBorrowingRules(membershipType);
  // Hạn mới sẽ được cộng thêm số ngày gia hạn từ hạn cũ.
  // Ví dụ: hạn cũ 14/12, thời lượng gia hạn 7 ngày → hạn mới 21/12.
  return addDays(currentDueDate, rules.renewalDurationDays);
}

/**
 * Tạo phiếu mượn theo membership (giữ nguyên yêu cầu membership, đảm bảo atomicity bằng transaction)
 */
export async function createBorrow(
  userId: string,
  bookId: string
): Promise<IBorrow> {
  const session = await mongoose.startSession();
  let bookBecameUnavailable = false;
  
  try {
    let borrowId: string = '';
    
    await session.withTransaction(async () => {
      // 1. Lock và check book availability
      const book = await findBookByIdOrSlug(bookId, session);
      if (!book) {
        throw new Error('Sách không tồn tại');
      }
      
      if (!book.isActive || book.status !== 'available' || book.available <= 0) {
        throw new Error('Sách không còn sẵn');
      }
      const wasLastCopy = (book.available ?? 0) === 1;

      // 2. Validate permission (có thể cache để optimize)
      const validation = await validateBorrowingPermission(userId, bookId);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // 3. Decrease available atomically
      const updateResult = await Book.updateOne(
        { _id: book._id, available: { $gt: 0 } }, // Use book._id instead of bookId (which might be slug)
        { $inc: { available: -1 } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Sách không còn sẵn (đã được mượn bởi người khác)');
      }
      if (wasLastCopy) {
        bookBecameUnavailable = true;
      }

      // 4. Create borrow
      const user = await User.findById(userId).populate('membershipPlanId').session(session);
      if (!user || !user.membershipPlanId) {
        throw new Error('Người dùng không hợp lệ hoặc chưa có gói thành viên');
      }

      const membershipPlan = user.membershipPlanId as any;
      const membershipType = membershipPlan.name || MembershipType.STANDARD;
      const rules = getBorrowingRules(membershipType);

      const borrowDate = new Date();
      const dueDate = calculateDueDate(borrowDate, membershipType);

      const borrow = new Borrow({
        user: userId,
        book: book._id, // Use book._id instead of bookId (which might be slug)
        borrowDate,
        dueDate,
        status: 'Borrowed',
        renewalCount: 0,
        maxRenewals: rules.maxRenewals,
        lateFee: 0,
        damageFee: 0
      });

      await borrow.save({ session });
      borrowId = (borrow._id as any).toString();
    });

    if (!borrowId) {
      throw new Error('Lỗi khi tạo phiếu mượn');
    }

    // Populate sau khi transaction commit
    const borrow = await Borrow.findById(borrowId)
      .populate('book user') as IBorrow;

    // Handle reservation và send email (không trong transaction)
    await handleReservationAfterBorrow(bookId);
    sendBorrowSuccessEmail(borrowId).catch(err => 
      console.error('Failed to send borrow success email:', err)
    );
    if (bookBecameUnavailable) {
      markFavoritesWaitingForAvailability(bookId).catch(err =>
        console.error('Failed to flag favorite notifications:', err)
      );
    }

    return borrow;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Tạo phiếu mượn lẻ (Rental) sau khi đã thanh toán thành công
 */
export async function createRentalBorrow(
  userId: string,
  bookId: string,
  paymentIdentifier: string, // Có thể là paymentId hoặc providerRef
  rentalDays: number
): Promise<IBorrow> {
  // Validate Rental basic
  const validation = await validateRentalPermission(userId, bookId, rentalDays);
  if (!validation.isValid) {
    throw new Error(validation.errors.join('; '));
  }

  // Kiểm tra payment - cho phép 'Pending' trong mock mode
  // Hỗ trợ cả paymentId (MongoDB _id) và providerRef
  const isMockMode = process.env.PAYOS_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';
  const paymentStatusFilter = isMockMode ? { $in: ['Pending', 'Succeeded'] } : 'Succeeded';
  
  // Thử tìm bằng _id trước (nếu là ObjectId hợp lệ), sau đó thử providerRef
  let payment = null;
  
  if (mongoose.Types.ObjectId.isValid(paymentIdentifier)) {
    // Có thể là paymentId (_id)
    payment = await Payment.findOne({
      _id: paymentIdentifier,
      user: userId,
      type: 'Rental',
      status: paymentStatusFilter
    });
  }
  
  // Nếu không tìm thấy bằng _id, thử tìm bằng providerRef
  if (!payment) {
    payment = await Payment.findOne({
      providerRef: paymentIdentifier,
      user: userId,
      type: 'Rental',
      status: paymentStatusFilter
    });
  }
  
  if (!payment) {
    throw new Error('Payment không hợp lệ hoặc chưa thành công');
  }
  
  // Trong mock mode, tự động chuyển payment sang 'Succeeded' nếu đang là 'Pending'
  if (isMockMode && payment.status === 'Pending') {
    payment.status = 'Succeeded';
    await payment.save();
  }
  
  // Lưu providerRef để dùng cho paymentId trong Borrow record
  const paymentProviderRef = payment.providerRef;
  if (String(payment.book) !== String(bookId)) {
    throw new Error('Payment không khớp sách');
  }
  if (typeof payment.rentalDays === 'number' && payment.rentalDays !== rentalDays) {
    throw new Error('Payment không khớp số ngày thuê');
  }
  // Payment chưa được sử dụng (check bằng providerRef)
  const used = await Borrow.exists({ paymentId: paymentProviderRef });
  if (used) {
    throw new Error('Payment đã được sử dụng');
  }

  // Lấy sách và bản sao
  const book = await findBookByIdOrSlug(bookId);
  if (!book) throw new Error('Sách không tồn tại');
  
  if (!book.isActive || book.status !== 'available' || book.available <= 0) {
    throw new Error('Sách không còn sẵn');
  }
  const rentalWasLastCopy = (book.available ?? 0) === 1;

  // Tìm BookCopy có sẵn, nếu không có thì tạo mới
  let bookCopy = await BookCopy.findOne({ bookId, status: 'available', isActive: true }).sort({ createdAt: 1 });
  
  if (!bookCopy) {
    // Nếu không có BookCopy, tạo một bản sao mới
    // Tạo barcode tự động
    const barcode = `BC${Date.now()}${Math.floor(Math.random() * 1000)}`;
    bookCopy = await BookCopy.create({
      bookId: book._id, // Use book._id instead of bookId (which might be slug)
      barcode,
      status: 'available',
      isActive: true,
      condition: 'good'
    });
  }

  const borrowDate = new Date();
  const dueDate = addDays(borrowDate, rentalDays);
  const rentalPricePerDay = book.rentalPrice || 0;
  const totalRentalPrice = rentalPricePerDay * rentalDays;

  const borrow = new Borrow({
    user: userId,
    book: book._id, // Use book._id instead of bookId (which might be slug)
    bookCopy: bookCopy._id,
    borrowType: 'Rental',
    borrowDate,
    dueDate,
    status: 'Borrowed',
    renewalCount: 0,
    maxRenewals: 0,
    lateFee: 0,
    damageFee: 0,
    rentalDays,
    rentalPricePerDay,
    totalRentalPrice,
    paymentId: paymentProviderRef
  });

  await borrow.save();

  // Update copy and book
  bookCopy.status = 'borrowed';
  await bookCopy.save();
  
  // Giảm số lượng sách có sẵn (atomic update)
  const updateResult = await Book.updateOne(
    { _id: book._id, available: { $gt: 0 } }, // Use book._id instead of bookId (which might be slug)
    { $inc: { available: -1 } }
  );
  
  if (updateResult.modifiedCount === 0) {
    // Rollback bookCopy status nếu không update được book
    bookCopy.status = 'available';
    await bookCopy.save();
    throw new Error('Sách không còn sẵn (đã được mượn bởi người khác)');
  }

  const borrowId = (borrow._id as any).toString();
  sendBorrowSuccessEmail(borrowId).catch(err =>
    console.error('Failed to send borrow success email:', err)
  );
  if (rentalWasLastCopy) {
    markFavoritesWaitingForAvailability(bookId).catch(err =>
      console.error('Failed to flag favorite notifications:', err)
    );
  }

  return borrow.populate('book user');
}

/**
 * Xử lý đặt trước sau khi có sách được mượn (khi available giảm)
 * Note: Hàm này được gọi nhưng thực tế không cần xử lý gì vì reservation sẽ chờ đến khi sách được trả
 */
async function handleReservationAfterBorrow(bookId: string): Promise<void> {
  // Không cần xử lý gì ở đây vì reservation sẽ chờ đến khi sách được trả
  // Logic xử lý chính nằm ở handleReservationAfterReturn
}

/**
 * Trả sách (với transaction để đảm bảo atomicity)
 * Chỉ Admin/Librarian mới có quyền trả sách
 */
export async function returnBook(
  borrowId: string,
  staffUserId: string,
  staffRole: string,
  bookCondition?: string,
  notes?: string
): Promise<IBorrow> {
  const session = await mongoose.startSession();
  
  try {
    let borrow: IBorrow | null = null;
    let bookId: string = '';
    let borrowUserId: string = ''; // Khai báo ở ngoài để dùng sau transaction
    let resolvedBookCondition: BookCondition = BOOK_CONDITION.GOOD;
    
    await session.withTransaction(async () => {
      borrow = await Borrow.findById(borrowId).populate('book user bookCopy').session(session) as IBorrow;

      if (!borrow) {
        throw new Error('Phiếu mượn không tồn tại');
      }

      // Kiểm tra quyền: chỉ Admin/Librarian mới có quyền trả sách
      const normalizedRole = (staffRole || '').toString().trim();
      const normalizedRoleLower = normalizedRole.toLowerCase();
      const isAdmin = normalizedRoleLower === 'admin';
      const isLibrarian = normalizedRoleLower === 'librarian';
      
      // Debug logging
      console.log('returnBook - Role check:', {
        staffRole,
        normalizedRole,
        normalizedRoleLower,
        isAdmin,
        isLibrarian
      });
      
      if (!isAdmin && !isLibrarian) {
        console.error(`Unauthorized return attempt: staffRole="${staffRole}", normalized="${normalizedRole}", lower="${normalizedRoleLower}"`);
        throw new Error('Chỉ Admin/Librarian mới có quyền trả sách');
      }
      
      // Lấy userId của người mượn sách (để tính phí và cập nhật debt)
      borrowUserId = (borrow.user as any)?._id 
        ? String((borrow.user as any)._id) 
        : String(borrow.user);

      // Kiểm tra trạng thái: không cho phép trả lại nếu đã được trả hoặc đã xử lý
      if (borrow.status === 'Returned' || borrow.status === 'Lost' || borrow.status === 'Damaged') {
        throw new Error(`Sách đã được xử lý với trạng thái: ${borrow.status}`);
      }

      const returnDate = new Date();
      
      // Tính phí phạt trễ hạn
      const user = borrow.user as any;
      const membershipPlan = user.membershipPlanId 
        ? await MembershipPlan.findById(user.membershipPlanId).session(session)
        : null;
      const membershipType = membershipPlan?.name || MembershipType.STANDARD;

      // Kiểm tra có phải lần trễ đầu không (của người mượn sách)
      const previousLateFees = await Borrow.countDocuments({
        user: borrowUserId,
        status: 'Returned',
        lateFee: { $gt: 0 }
      }).session(session);
      const isFirstTimeLate = previousLateFees === 0;

      const lateFee = calculateLateFee(borrow.dueDate, returnDate, membershipType, isFirstTimeLate);

      // Tính phí hư hỏng (nếu có)
      const book = borrow.book as any;
      const price = typeof book.price === 'number' ? book.price : 0;
      const normalizedCondition = normalizeBookCondition(bookCondition);
      resolvedBookCondition = normalizedCondition;
      const damageFee = calculateDamageFeeByCondition(normalizedCondition, price);
      const conditionIsLost = isLostCondition(normalizedCondition);
      const conditionIsDamaged = isDamagedCondition(normalizedCondition);

      // Cập nhật phiếu mượn
      borrow.returnDate = returnDate;
      borrow.status = conditionIsLost ? 'Lost' : (conditionIsDamaged ? 'Damaged' : 'Returned');
      borrow.lateFee = lateFee;
      borrow.damageFee = damageFee;
      if (notes) borrow.notes = notes;
      await borrow.save({ session });

      // Lấy bookId: có thể là ObjectId hoặc đã được populate
      const bookObj = borrow.book as any;
      bookId = bookObj._id ? String(bookObj._id) : String(borrow.book);

      // Cập nhật BookCopy nếu có (Rental borrow có bookCopy, Membership không có)
      if (borrow.bookCopy) {
        // Lấy bookCopyId: có thể là ObjectId hoặc đã được populate
        let bookCopyId: string;
        if ((borrow.bookCopy as any)?._id) {
          // Đã được populate thành object
          bookCopyId = String((borrow.bookCopy as any)._id);
        } else {
          // Chưa populate, là ObjectId
          bookCopyId = String(borrow.bookCopy);
        }
        
        // Validate ObjectId format trước khi update
        if (!mongoose.Types.ObjectId.isValid(bookCopyId)) {
          console.warn(`Invalid bookCopyId format: ${bookCopyId}, skipping BookCopy update`);
        } else {
          try {
            if (conditionIsLost) {
              // Nếu sách bị mất, đánh dấu BookCopy là 'lost'
              await BookCopy.updateOne(
                { _id: bookCopyId },
                { status: 'lost', isActive: false },
                { session }
              );
            } else if (conditionIsDamaged) {
              // Nếu sách bị hư hỏng, đánh dấu BookCopy là 'damaged'
              await BookCopy.updateOne(
                { _id: bookCopyId },
                { status: 'damaged', isActive: false },
                { session }
              );
            } else {
              // Trả sách bình thường, đánh dấu BookCopy là 'available'
              await BookCopy.updateOne(
                { _id: bookCopyId },
                { status: 'available' },
                { session }
              );
            }
          } catch (error: any) {
            console.error(`Failed to update BookCopy ${bookCopyId}:`, error?.message || error);
            // Không throw, chỉ log lỗi để không block việc trả sách
            // BookCopy update là optional, không nên block việc trả sách
          }
        }
      }

      // Tăng số lượng sách có sẵn (nếu không bị Lost)
      if (!conditionIsLost) {
        await Book.updateOne(
          { _id: bookId },
          { $inc: { available: 1 } },
          { session }
        );
      } else {
        // Giảm stock nếu sách bị Lost
        await Book.updateOne(
          { _id: bookId },
          { $inc: { stock: -1 } },
          { session }
        );
      }

      // Cập nhật công nợ cho user (người mượn sách)
      if (lateFee > 0 || damageFee > 0) {
        const totalFee = lateFee + damageFee;
        const userDoc = await User.findById(borrowUserId).session(session);
        if (userDoc) {
          userDoc.debt = (userDoc.debt || 0) + totalFee;
          userDoc.debtLastUpdated = new Date();
          userDoc.totalSpent += totalFee;
          await userDoc.save({ session });
        }
      }
    });

    if (!borrow || !bookId) {
      throw new Error('Lỗi khi xử lý trả sách');
    }

    // Ghi nhận vi phạm và xử lý reservation (ngoài transaction)
    const finalBorrow = borrow as IBorrow; // Type assertion sau khi check null
    
    // Ghi nhận vi phạm (nếu có)
    if (finalBorrow.lateFee > 0 || finalBorrow.damageFee > 0) {
      const hasDamageFee = finalBorrow.damageFee > 0;
      const severity = hasDamageFee ? 'High' : (finalBorrow.lateFee > 0 ? 'Medium' : 'Low');
      const violationType = hasDamageFee
        ? (isLostCondition(resolvedBookCondition) ? 'Lost' : 'Damaged')
        : 'Overdue';
      
      try {
        const borrowIdStr = (finalBorrow._id as any).toString();
        // Ghi nhận vi phạm cho người mượn sách (borrowUserId), không phải staff
        await recordViolation(borrowUserId, violationType, borrowIdStr, severity);
      } catch (error) {
        console.error('Failed to record violation:', error);
        // Không throw, chỉ log lỗi
      }
    }

    // Xử lý đặt trước (không block nếu lỗi)
    try {
      await handleReservationAfterReturn(bookId);
    } catch (error) {
      console.error('Failed to handle reservation after return:', error);
      // Không throw, chỉ log lỗi
    }
    notifyFavoriteReadersIfBookAvailable(bookId).catch(err =>
      console.error('Failed to notify favorite readers:', err)
    );

    // Populate lại để trả về đầy đủ
    try {
      const borrowIdStr = (finalBorrow._id as any).toString();
      const populatedBorrow = await Borrow.findById(borrowIdStr).populate('book user') as IBorrow;
      
      if (!populatedBorrow) {
        throw new Error('Không tìm thấy phiếu mượn sau khi trả');
      }
      
      return populatedBorrow;
    } catch (error) {
      console.error('Failed to populate borrow:', error);
      // Nếu populate fail, trả về borrow chưa populate
      return finalBorrow;
    }
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Xử lý đặt trước sau khi trả sách
 * Gán reservation tiếp theo cho sách (tự động chuyển sang Assigned nếu sách có sẵn)
 */
async function handleReservationAfterReturn(bookId: string): Promise<void> {
  // Gán reservation tiếp theo cho sách
  // Hàm này sẽ tự động:
  // 1. Tìm reservation Pending đầu tiên (FIFO)
  // 2. Nếu sách có sẵn, chuyển reservation sang Assigned và gửi email thông báo
  // 3. Nếu sách không có sẵn, giữ reservation ở trạng thái Pending
  await assignNextReservation(bookId);
}

/**
 * Gia hạn mượn sách
 */
export async function renewBorrow(
  borrowId: string,
  userId: string
): Promise<IBorrow> {
  // Kiểm tra có thể gia hạn
  const validation = await canRenewBorrow(borrowId, userId);
  if (!validation.canRenew) {
    throw new Error(validation.reason || 'Không thể gia hạn');
  }

  const borrow = await Borrow.findById(borrowId).populate('user');
  if (!borrow) {
    throw new Error('Phiếu mượn không tồn tại');
  }

  // Lấy loại thành viên
  const user = borrow.user as any;
  const membershipPlan = user.membershipPlanId
    ? await MembershipPlan.findById(user.membershipPlanId)
    : null;
  const membershipType = membershipPlan?.name || MembershipType.STANDARD;

  // Tính ngày hết hạn mới
  const newDueDate = calculateNewDueDate(borrow.dueDate, membershipType);

  // Cập nhật
  borrow.dueDate = newDueDate;
  borrow.renewalCount += 1;
  await borrow.save();

  return borrow.populate('book user');
}

/**
 * Tạo payment link cho mượn lẻ
 */
export async function createRentalPaymentLink(
  userId: string,
  bookId: string,
  rentalDays: number
) {
  // Validate rental basic (không check payment ở đây)
  const validation = await validateRentalPermission(userId, bookId, rentalDays);
  if (!validation.isValid) {
    throw new Error(validation.errors.join('; '));
  }

  const book = await findBookByIdOrSlug(bookId);
  if (!book) {
    throw new Error('Sách không tồn tại');
  }

  const amount = (book.rentalPrice || 0) * rentalDays;
  const description = `Rental for book ${book.title} (${rentalDays} days)`;

  const { paymentId, providerRef, checkoutUrl, expiresAt } = await createPayOSPaymentLink({
    userId,
    type: 'Rental',
    bookId,
    rentalDays,
    amount,
    description,
    metadata: { bookId, rentalDays, type: 'Rental' }
  });

  return { 
    provider: 'PayOS', 
    paymentId,
    providerRef, 
    checkoutUrl, 
    expiresAt, 
    amount, 
    rentalDays 
  };
}

/**
 * Tính phạt trễ hạn tự động cho tất cả sách quá hạn
 * Hàm này được gọi bởi cron job hoặc API endpoint
 */
export async function calculateLateFeesAutomatically(): Promise<{
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
}> {
  const now = new Date();
  
  // Tìm tất cả sách đang mượn và quá hạn
  const overdueBorrows = await Borrow.find({
    status: { $in: ['Borrowed', 'Overdue'] },
    dueDate: { $lt: now }
  }).populate({
    path: 'user',
    populate: { path: 'membershipPlanId' }
  });

  const details: Array<{
    borrowId: string;
    userId: string;
    bookId: string;
    daysLate: number;
    lateFee: number;
    updated: boolean;
  }> = [];

  let totalUpdated = 0;
  let totalLateFee = 0;

  for (const borrow of overdueBorrows) {
    const user = borrow.user as any;
    const membershipPlan = user?.membershipPlanId;
    
    // Bỏ qua nếu không có membership plan (Rental hoặc user không có membership)
    if (!membershipPlan && borrow.borrowType === 'Membership') {
      continue;
    }

    // Tính số ngày trễ
    const daysLate = Math.floor((now.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLate <= 0) {
      continue;
    }

    // Lấy loại thành viên
    const membershipType = (membershipPlan as any)?.name || MembershipType.STANDARD;
    const rules = getBorrowingRules(membershipType);

    // Kiểm tra có phải lần trễ đầu không
    const previousLateFees = await Borrow.countDocuments({
      user: borrow.user,
      status: 'Returned',
      lateFee: { $gt: 0 },
      _id: { $ne: borrow._id }
    });
    const isFirstTimeLate = previousLateFees === 0;

    // Tính phí phạt mới
    let newLateFee = 0;
    if (
      rules.firstTimeLateFeeWaiver &&
      isFirstTimeLate &&
      daysLate <= rules.firstTimeLateFeeWaiverDays
    ) {
      newLateFee = 0; // Miễn phí 3 ngày đầu cho Premium
    } else {
      newLateFee = daysLate * rules.lateFeePerDay;
    }

    const wasUpdated = borrow.lateFee !== newLateFee;

    // Cập nhật nếu phí phạt thay đổi
    if (wasUpdated) {
      borrow.lateFee = newLateFee;
      borrow.status = 'Overdue';
      await borrow.save();
      totalUpdated++;
    }

    totalLateFee += newLateFee;

    details.push({
      borrowId: (borrow._id as any).toString(),
      userId: (borrow.user as any)._id?.toString() || (borrow.user as any).toString(),
      bookId: (borrow.book as any)._id?.toString() || (borrow.book as any).toString(),
      daysLate,
      lateFee: newLateFee,
      updated: wasUpdated
    });
  }

  return {
    totalProcessed: overdueBorrows.length,
    totalUpdated,
    totalLateFee,
    details
  };
}

