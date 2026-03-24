import mongoose from 'mongoose';
import Reservation, { IReservation, ReservationStatus } from '../models/Reservation';
import Book from '../models/Book';
import User from '../models/User';
import Borrow from '../models/Borrow';
import MembershipPlan from '../models/MembershipPlan';
import { 
  getBorrowingRules, 
  MembershipType,
  STANDARD_MEMBER_RULES,
  PREMIUM_MEMBER_RULES
} from '../utils/borrowingConstants';
import { 
  sendReservationConfirmationEmail,
  sendReservationAvailableEmail,
  sendReservationExpiringSoonEmail,
  sendReservationExpiredEmail,
  sendReservationNextInLineEmail
} from './emailService';
import { createBorrow } from './borrowService';

export interface ReservationValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Helper function để lấy ObjectId string từ field có thể đã populate hoặc chưa
 */
function getObjectIdString(field: any): string {
  if (!field) {
    throw new Error('Trường dữ liệu không tồn tại');
  }
  
  // Nếu là ObjectId hoặc string
  if (typeof field === 'string' || mongoose.Types.ObjectId.isValid(field)) {
    return field.toString();
  }
  
  // Nếu là object đã populate, lấy _id
  if (typeof field === 'object' && field !== null && '_id' in field) {
    return field._id.toString();
  }
  
  // Fallback: thử toString()
  return String(field);
}

/**
 * Kiểm tra điều kiện đặt sách
 */
export async function validateReservation(
  userId: string,
  bookId: string
): Promise<ReservationValidationResult> {
  const errors: string[] = [];
  
  // 1. Kiểm tra user tồn tại và có quyền đặt sách
  const user = await User.findById(userId).populate('membershipPlanId');
  if (!user) {
    errors.push('Người dùng không tồn tại');
    return { isValid: false, errors };
  }
  
  // Kiểm tra trạng thái tài khoản
  if (user.status !== 'Active') {
    errors.push(`Tài khoản đang ở trạng thái: ${user.status}`);
  }
  
  if (!user.isActive) {
    errors.push('Tài khoản đã bị vô hiệu hóa');
  }
  
  if (!user.canBorrow) {
    errors.push('Tài khoản đã bị khóa quyền mượn sách');
  }
  
  // 2. Kiểm tra gói thành viên
  if (!user.membershipPlanId) {
    errors.push('Bạn chưa đăng ký gói thành viên');
    return { isValid: false, errors };
  }
  
  const membershipPlan = user.membershipPlanId as any;
  if (!membershipPlan.isActive) {
    errors.push('Gói thành viên đã hết hạn hoặc bị vô hiệu hóa');
  }
  
  // Kiểm tra gói thành viên còn hiệu lực
  if (user.membershipEndDate && user.membershipEndDate < new Date()) {
    errors.push('Gói thành viên của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục đặt sách.');
    return { isValid: false, errors };
  }
  
  // Nếu chưa có endDate, kiểm tra dựa trên startDate + duration
  if (!user.membershipEndDate && user.membershipStartDate && membershipPlan.duration) {
    const calculatedEndDate = new Date(user.membershipStartDate);
    calculatedEndDate.setMonth(calculatedEndDate.getMonth() + membershipPlan.duration);
    
    if (calculatedEndDate < new Date()) {
      errors.push('Gói thành viên của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục đặt sách.');
      return { isValid: false, errors };
    }
  }
  
  // 3. Kiểm tra số lượng đặt sách tối đa
  const membershipType = membershipPlan.name || MembershipType.STANDARD;
  const rules = getBorrowingRules(membershipType);
  
  const currentReservations = await Reservation.countDocuments({
    user: userId,
    status: { $in: ['Pending', 'Assigned'] }
  });
  
  if (currentReservations >= rules.maxReservations) {
    errors.push(
      `Bạn đã đạt tối đa ${rules.maxReservations} lượt đặt trước. ` +
      `Vui lòng hủy một đặt trước trước khi tạo mới.`
    );
  }
  
  // 4. Kiểm tra nợ phí phạt quá lớn
  if (user.debt > 50000) { // MAX_DEBT_ALLOWED từ debtService
    errors.push(
      `Bạn có nợ phí phạt ${user.debt.toLocaleString('vi-VN')} VNĐ. ` +
      `Vui lòng thanh toán để tiếp tục đặt sách.`
    );
  }
  
  // 5. Kiểm tra sách tồn tại
  const book = await Book.findById(bookId);
  if (!book) {
    errors.push('Sách không tồn tại');
    return { isValid: false, errors };
  }
  
  if (!book.isActive || book.status !== 'available') {
    errors.push('Sách không có sẵn để đặt trước');
  }
  
  // 6. Kiểm tra đã mượn sách này chưa
  const existingBorrow = await Borrow.findOne({
    user: userId,
    book: bookId,
    status: { $in: ['Borrowed', 'Overdue'] }
  });
  
  if (existingBorrow) {
    errors.push('Bạn đang mượn cuốn sách này, không thể đặt trước');
  }
  
  // 7. Kiểm tra đã đặt sách này chưa
  const existingReservation = await Reservation.findOne({
    user: userId,
    book: bookId,
    status: { $in: ['Pending', 'Assigned'] }
  });
  
  if (existingReservation) {
    errors.push('Bạn đã đặt trước cuốn sách này');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Tạo yêu cầu đặt sách
 */
export async function createReservation(
  userId: string,
  bookId: string
): Promise<IReservation> {
  // Validate
  const validation = await validateReservation(userId, bookId);
  if (!validation.isValid) {
    throw new Error(validation.errors.join('; '));
  }
  
  const user = await User.findById(userId).populate('membershipPlanId');
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error('Sách không tồn tại');
  }
  
  const membershipPlan = user.membershipPlanId as any;
  const membershipType = membershipPlan.name || MembershipType.STANDARD;
  const rules = getBorrowingRules(membershipType);
  
  // Tính thời gian hết hạn giữ sách
  const expiresAt = new Date(
    Date.now() + rules.reservationHoldHours * 60 * 60 * 1000
  );
  
  // Tạo reservation (chưa set queuePosition, sẽ tính sau khi lưu)
  const reservation = new Reservation({
    user: userId,
    book: bookId,
    expiresAt
  });
  
  await reservation.save();
  
  // Debug: Kiểm tra số lượng reservation Pending trước khi cập nhật
  const pendingCountBefore = await Reservation.countDocuments({
    book: bookId,
    status: 'Pending'
  });
  console.log(`[Reservation] Book ${bookId} has ${pendingCountBefore} pending reservations before update`);
  
  // Cập nhật lại queuePosition cho TẤT CẢ reservation Pending của cuốn sách này
  // Đảm bảo queuePosition luôn đúng theo thứ tự thời gian
  await updateQueuePositions(bookId);
  
  // Reload reservation để lấy queuePosition đã được cập nhật
  const updatedReservation = await Reservation.findById(reservation._id)
    .populate('book')
    .populate('user');
  
  if (!updatedReservation) {
      throw new Error('Không thể tải lại đặt trước sau khi cập nhật');
  }
  
  console.log(`[Reservation] Created reservation ${updatedReservation._id} with queuePosition: ${updatedReservation.queuePosition}`);
  
  // Nếu sách có sẵn, gán ngay cho user
  const bookAfterReload = updatedReservation.book as any;
  if (bookAfterReload.available > 0) {
    await assignReservationToUser(String(updatedReservation._id));
    // Reload lại sau khi assign
    const finalReservation = await Reservation.findById(updatedReservation._id);
    return finalReservation || updatedReservation;
  }
  
  // Nếu sách không có sẵn, gửi email xác nhận với queuePosition đã được cập nhật
  sendReservationConfirmationEmail(
    user.email,
    bookAfterReload.title,
    updatedReservation.queuePosition || 1,
    expiresAt
  ).catch(err => console.error('Không thể gửi email xác nhận đặt trước:', err));
  
  return updatedReservation;
  
  return reservation;
}

/**
 * Gán reservation cho user (khi sách có sẵn)
 */
export async function assignReservationToUser(reservationId: string): Promise<IReservation | null> {
  const reservation = await Reservation.findById(reservationId)
    .populate('user')
    .populate('book');
    
  if (!reservation) {
    throw new Error('Đặt trước không tồn tại');
  }
  
  if (reservation.status !== 'Pending') {
    throw new Error('Chỉ có thể gán đặt trước ở trạng thái Pending');
  }
  
  const user = reservation.user as any;
  const book = reservation.book as any;
  
  // Kiểm tra sách còn sẵn không
  if (book.available <= 0) {
    // Không có sẵn, chỉ cập nhật queue position nếu cần
    const queuePosition = await Reservation.countDocuments({
      book: book._id,
      status: 'Pending',
      createdAt: { $lt: reservation.createdAt }
    }) + 1;
    
    reservation.queuePosition = queuePosition;
    await reservation.save();
    return reservation;
  }
  
  // Kiểm tra user có đủ điều kiện mượn không
  // Lưu ý: Khi thủ thư duyệt, validation có thể fail nhưng vẫn nên assign
  // vì thủ thư đã kiểm tra và quyết định duyệt
  const validation = await validateReservation(user._id.toString(), book._id.toString());
  if (!validation.isValid) {
    console.warn(`[assignReservationToUser] Validation failed for reservation ${reservationId}:`, validation.errors);
    // Nếu validation fail, vẫn tiếp tục assign nếu sách có sẵn
    // (vì có thể thủ thư đã kiểm tra và quyết định duyệt)
    // Chỉ cảnh báo, không block
  }
  
  // Gán sách cho user
  reservation.status = 'Assigned';
  reservation.assignedAt = new Date();
  reservation.queuePosition = 0; // Đã được gán, không còn trong hàng chờ
  
  // Tính lại thời gian hết hạn giữ sách
  const membershipPlan = user.membershipPlanId 
    ? await MembershipPlan.findById(user.membershipPlanId)
    : null;
  const membershipType = membershipPlan?.name || MembershipType.STANDARD;
  const rules = getBorrowingRules(membershipType);
  
  reservation.expiresAt = new Date(
    Date.now() + rules.reservationHoldHours * 60 * 60 * 1000
  );
  
  await reservation.save();
  
  console.log(`[assignReservationToUser] Reservation ${reservationId} assigned successfully. Status: ${reservation.status}, QueuePosition: ${reservation.queuePosition}`);
  
  // Gửi email thông báo sách có sẵn
  sendReservationAvailableEmail(
    user.email,
    book.title,
    reservation.expiresAt
  ).catch(err => console.error('Không thể gửi email thông báo sách có sẵn:', err));
  
  return reservation;
}

/**
 * Duyệt reservation bởi thủ thư
 */
export async function approveReservation(
  reservationId: string,
  librarianId: string
): Promise<IReservation> {
  const reservation = await Reservation.findById(reservationId)
    .populate('user')
    .populate('book');
    
  if (!reservation) {
    throw new Error('Đặt trước không tồn tại');
  }
  
  if (reservation.status !== 'Pending') {
    throw new Error('Chỉ có thể duyệt đặt trước ở trạng thái Pending');
  }
  
  const book = reservation.book as any;
  
  // Nếu sách có sẵn, gán ngay cho user
  if (book.available > 0) {
    const assignedReservation = await assignReservationToUser(reservationId);
    
    // Reload reservation để đảm bảo có đầy đủ thông tin mới nhất
    const finalReservation = await Reservation.findById(reservationId)
      .populate('user')
      .populate('book');
    
    if (!finalReservation) {
      throw new Error('Không thể tải lại đặt trước sau khi gán');
    }
    
    // Cập nhật lại queuePosition cho các reservation Pending còn lại
    await updateQueuePositions(book._id.toString());
    
    return finalReservation;
  }
  
  // Nếu sách không có sẵn, giữ nguyên trạng thái Pending và cập nhật queue position
  await updateQueuePositions(book._id.toString());
  
  // Reload reservation để lấy queuePosition đã được cập nhật
  const updatedReservation = await Reservation.findById(reservationId)
    .populate('user')
    .populate('book');
  
  if (!updatedReservation) {
      throw new Error('Không thể tải lại đặt trước sau khi cập nhật');
  }
  
  return updatedReservation;
}

/**
 * Hủy reservation
 */
export async function cancelReservation(
  reservationId: string,
  userId?: string
): Promise<IReservation> {
  // Lấy reservation KHÔNG populate để kiểm tra quyền dễ dàng hơn
  const reservationForCheck = await Reservation.findById(reservationId);
  if (!reservationForCheck) {
    throw new Error('Đặt trước không tồn tại');
  }
  
  const bookId = reservationForCheck.book.toString();
  
  // Kiểm tra quyền hủy (so sánh trực tiếp ObjectId, không cần populate)
  if (userId) {
    // reservationForCheck.user là ObjectId (chưa populate)
    const reservationUserId = reservationForCheck.user.toString();
    const requestUserId = String(userId).trim();
    
    // So sánh bằng ObjectId.equals() để đảm bảo chính xác
    let hasPermission = false;
    
    if (mongoose.Types.ObjectId.isValid(reservationUserId) && 
        mongoose.Types.ObjectId.isValid(requestUserId)) {
      const reservationObjId = new mongoose.Types.ObjectId(reservationUserId);
      const requestObjId = new mongoose.Types.ObjectId(requestUserId);
      hasPermission = reservationObjId.equals(requestObjId);
    } else {
      // Fallback: so sánh string
      hasPermission = reservationUserId.trim() === requestUserId;
    }
    
    if (!hasPermission) {
      console.error(`[cancelReservation] Permission check FAILED:`);
      console.error(`  - reservation.user: ${reservationUserId}`);
      console.error(`  - request.userId: ${requestUserId}`);
      throw new Error('Bạn không có quyền hủy đặt trước này');
    }
  }
  
  // Kiểm tra status
  if (reservationForCheck.status !== 'Pending' && reservationForCheck.status !== 'Assigned') {
    throw new Error('Chỉ có thể hủy đặt trước ở trạng thái Pending hoặc Assigned');
  }
  
  const wasPending = reservationForCheck.status === 'Pending';
  reservationForCheck.status = 'Cancelled';
  await reservationForCheck.save();
  
  // Nếu là reservation Pending, cập nhật queue position cho các reservation khác
  if (wasPending) {
    await updateQueuePositions(bookId);
  }
  
  // Populate để trả về đầy đủ thông tin
  const reservation = await Reservation.findById(reservationId)
    .populate('user')
    .populate('book');
  
  if (!reservation) {
    // Nếu không populate được, trả về reservationForCheck (chưa populate)
    return reservationForCheck;
  }
  
  return reservation;
}

/**
 * Hoàn thành reservation (user đến lấy sách)
 */
export async function fulfillReservation(
  reservationId: string
): Promise<{ reservation: IReservation, borrow: any }> {
  const reservation = await Reservation.findById(reservationId)
    .populate('user')
    .populate('book');
    
  if (!reservation) {
    throw new Error('Đặt trước không tồn tại');
  }
  
  if (reservation.status !== 'Assigned') {
    throw new Error('Chỉ có thể hoàn thành đặt trước ở trạng thái Assigned');
  }
  
  const user = reservation.user as any;
  const book = reservation.book as any;
  
  // Kiểm tra sách còn sẵn không
  if (book.available <= 0) {
    throw new Error('Sách không còn sẵn để mượn');
  }
  
  // Tự động tạo phiếu mượn
  const borrow = await createBorrow(user._id.toString(), book._id.toString());
  
  // Cập nhật reservation
  reservation.status = 'Fulfilled';
  reservation.fulfilledAt = new Date();
  await reservation.save();
  
  return { reservation, borrow };
}

/**
 * Cập nhật vị trí trong hàng chờ cho tất cả reservations của một cuốn sách
 */
export async function updateQueuePositions(bookId: string): Promise<void> {
  const now = new Date();
  
  // Chỉ lấy reservation Pending và chưa hết hạn
  const pendingReservations = await Reservation.find({
    book: bookId,
    status: 'Pending',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: now } }
    ]
  }).sort({ createdAt: 1 });
  
  console.log(`[updateQueuePositions] Book ${bookId}: Found ${pendingReservations.length} pending reservations`);
  
  // Cập nhật queuePosition cho từng reservation
  for (let i = 0; i < pendingReservations.length; i++) {
    const oldPosition = pendingReservations[i].queuePosition;
    pendingReservations[i].queuePosition = i + 1;
    await pendingReservations[i].save();
    if (oldPosition !== i + 1) {
      console.log(`[updateQueuePositions] Reservation ${pendingReservations[i]._id}: ${oldPosition} -> ${i + 1}`);
    }
  }
}

/**
 * Gán reservation tiếp theo khi có sách được trả
 */
export async function assignNextReservation(bookId: string): Promise<IReservation | null> {
  // Tìm reservation Pending đầu tiên theo thứ tự FIFO
  const nextReservation = await Reservation.findOne({
    book: bookId,
    status: 'Pending'
  }).sort({ createdAt: 1 }).populate('user').populate('book');
  
  if (!nextReservation) {
    return null;
  }
  
  return await assignReservationToUser(String(nextReservation._id));
}

/**
 * Xử lý các reservation hết hạn
 */
export async function expireReservations(): Promise<{
  totalExpired: number;
  expiredReservations: IReservation[];
}> {
  const now = new Date();
  const expiredReservations = await Reservation.find({
    status: { $in: ['Pending', 'Assigned'] },
    expiresAt: { $lte: now }
  }).populate('user').populate('book');
  
  const expiredReservationDocs: IReservation[] = [];
  
  for (const reservation of expiredReservations) {
    const wasPending = reservation.status === 'Pending';
    
    // Lấy bookId đúng cách (xử lý cả trường hợp book đã populate và chưa populate)
    const bookId = getObjectIdString(reservation.book);
    
    reservation.status = 'Expired';
    await reservation.save();
    expiredReservationDocs.push(reservation);
    
    // Gửi email thông báo hết hạn
    const user = reservation.user as any;
    const book = reservation.book as any;
    
    sendReservationExpiredEmail(
      user.email,
      book.title
    ).catch(err => console.error('Không thể gửi email thông báo đặt trước hết hạn:', err));
    
    // Nếu là reservation Pending, cập nhật queue position cho các reservation khác
    if (wasPending) {
      await updateQueuePositions(bookId);
    }
    
    // Gán reservation tiếp theo nếu có
    await assignNextReservation(bookId);
  }
  
  return {
    totalExpired: expiredReservations.length,
    expiredReservations: expiredReservationDocs
  };
}

/**
 * Gửi email nhắc nhở reservation sắp hết hạn
 */
export async function sendExpiryReminders(): Promise<void> {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 giờ nữa
  
  // Tìm tất cả reservations sẽ hết hạn trong 1 giờ tới
  const expiringReservations = await Reservation.find({
    status: 'Assigned',
    expiresAt: {
      $gt: now,
      $lte: oneHourFromNow
    }
  }).populate('user').populate('book');
  
  for (const reservation of expiringReservations) {
    const user = reservation.user as any;
    const book = reservation.book as any;
    
    sendReservationExpiringSoonEmail(
      user.email,
      book.title,
      reservation.expiresAt!
    ).catch(err => console.error('Không thể gửi email nhắc nhở đặt trước sắp hết hạn:', err));
  }
}