import * as cron from 'node-cron';
import Borrow from '../models/Borrow';
import Book from '../models/Book';
import BookCopy from '../models/BookCopy';
import Reservation from '../models/Reservation';
import { getBorrowingRules, MembershipType } from '../utils/borrowingConstants';
import { sendDueDateReminderEmail, sendOverdueWarningEmail } from '../services/emailService';
import { 
  autoLockBorrowingPermissionForOverdue,
  autoLockBorrowingPermissionForPenaltyDebt,
  checkAndAutoUnsuspend,
  checkAndAutoSuspendOverdue
} from '../services/violationService';
import {
  scheduleBeforeDueReminders,
  scheduleOverdueReminders,
  processPendingReminders
} from '../services/reminderService';

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
export function startBorrowCronJobs() {
  // Chạy mỗi ngày lúc 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily borrow cron job at', new Date().toISOString());
    
    try {
      await updateLateFees();
      await sendDueDateReminders();
      await sendOverdueWarnings();
      
      // Tự động chuyển trạng thái sang Lost nếu quá hạn 30 ngày
      const lostResult = await autoMarkBorrowsAsLost();
      if (lostResult.totalMarked > 0) {
        console.log(`Đã tự động chuyển ${lostResult.totalMarked} phiếu mượn sang trạng thái Lost`);
      }
      
      // Tự động khóa quyền mượn cho user quá hạn >30 ngày
      const lockResult = await autoLockBorrowingPermissionForOverdue();
      if (lockResult.totalLocked > 0) {
        console.log(`Đã tự động khóa quyền mượn cho ${lockResult.totalLocked} user quá hạn >30 ngày`);
      }
      
      // Tự động khóa quyền mượn cho user có nợ phạt vượt mức
      const penaltyLockResult = await autoLockBorrowingPermissionForPenaltyDebt();
      if (penaltyLockResult.totalLocked > 0) {
        console.log(`Đã tự động khóa quyền mượn cho ${penaltyLockResult.totalLocked} user có nợ phạt vượt mức`);
      }
      
      await checkAndAutoSuspendOverdue();
      await checkAndAutoUnsuspend();
      await expireReservations();
      console.log('Daily borrow cron job completed successfully');
    } catch (error) {
      console.error('Error in daily borrow cron job:', error);
    }
  });

  // Chạy mỗi giờ để:
  // 1. Tạo reminders mới cho borrows sắp đến hạn và quá hạn
  // 2. Gửi các reminders đã đến lúc gửi
  // 3. Expire reservations
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running hourly reminder cron job at', new Date().toISOString());
      
      // Tạo reminders mới
      const beforeDueCount = await scheduleBeforeDueReminders();
      const overdueCount = await scheduleOverdueReminders();
      console.log(`Scheduled ${beforeDueCount} before-due reminders and ${overdueCount} overdue reminders`);
      
      // Gửi các reminders đã đến lúc
      const processResult = await processPendingReminders();
      console.log(`Processed ${processResult.processed} reminders: ${processResult.success} success, ${processResult.failed} failed`);
      
      // Giữ lại hàm cũ để tương thích (có thể xóa sau)
      await sendDueDateReminders();
      
      await expireReservations(); // Expire reservations mỗi giờ
    } catch (error) {
      console.error('Error in hourly reminder cron job:', error);
    }
  });

  console.log('Borrow cron jobs started');
}

/**
 * Cập nhật phí phạt trễ hạn cho tất cả sách quá hạn
 */
async function updateLateFees() {
  const now = new Date();
  
  // Tìm tất cả sách đang mượn và quá hạn
  const overdueBorrows = await Borrow.find({
    status: { $in: ['Borrowed', 'Overdue'] },
    dueDate: { $lt: now }
  }).populate({
    path: 'user',
    populate: { path: 'membershipPlanId' }
  });

  for (const borrow of overdueBorrows) {
    const user = borrow.user as any;
    const membershipPlan = user?.membershipPlanId;
    
    if (!membershipPlan) {
      continue;
    }

    const membershipType = (membershipPlan as any)?.name || MembershipType.STANDARD;
    const rules = getBorrowingRules(membershipType);

    // Tính số ngày trễ
    const daysLate = Math.floor((now.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLate <= 0) {
      continue;
    }

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
      daysLate <= ((rules as any).firstTimeLateFeeWaiverDays || 3)
    ) {
      newLateFee = 0; // Miễn phí 3 ngày đầu cho Premium
    } else {
      newLateFee = daysLate * rules.lateFeePerDay;
    }

    // Cập nhật nếu phí phạt thay đổi
    if (borrow.lateFee !== newLateFee) {
      borrow.lateFee = newLateFee;
      borrow.status = 'Overdue';
      await borrow.save();
    }
  }

  console.log(`Updated late fees for ${overdueBorrows.length} overdue borrows`);
}

/**
 * Gửi email nhắc nhở trước khi đến hạn (3 ngày và 1 ngày trước)
 */
export async function sendDueDateReminders() {
  const now = new Date();
  const isDevMode = process.env.NODE_ENV !== 'production';
  
  // Tìm sách sẽ đến hạn trong 3 ngày hoặc 1 ngày
  const threeDaysLater = new Date(now);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const startOfThreeDaysLater = new Date(threeDaysLater);
  startOfThreeDaysLater.setHours(0, 0, 0, 0);
  const endOfThreeDaysLater = new Date(startOfThreeDaysLater);
  endOfThreeDaysLater.setDate(endOfThreeDaysLater.getDate() + 1);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Sách đến hạn trong 3 ngày (chỉ gửi vào buổi sáng, tránh spam)
  // Trong dev mode, bỏ điều kiện giờ để dễ test
  if (isDevMode || now.getHours() === 9) {
    // Tìm tất cả borrows có dueDate trong khoảng 2.5 - 3.5 ngày từ bây giờ
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDayBorrows = await Borrow.find({
      status: 'Borrowed',
      dueDate: {
        $gte: new Date(threeDaysFromNow.getTime() - 12 * 60 * 60 * 1000), // 2.5 ngày
        $lte: new Date(threeDaysFromNow.getTime() + 12 * 60 * 60 * 1000)  // 3.5 ngày
      }
    }).populate('book user');

    console.log(`Found ${threeDayBorrows.length} borrows due in ~3 days`);

    for (const borrow of threeDayBorrows) {
      const daysUntilDue = Math.ceil(
        (borrow.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Cho phép gửi nếu còn 2-4 ngày (linh hoạt hơn)
      if (daysUntilDue >= 2 && daysUntilDue <= 4) {
        console.log(`Sending 3-day reminder for borrow ${borrow._id}, daysUntilDue: ${daysUntilDue}, dueDate: ${borrow.dueDate}`);
        await sendDueDateReminderEmail((borrow._id as any).toString(), daysUntilDue);
      } else {
        console.log(`Skipping borrow ${borrow._id}, daysUntilDue: ${daysUntilDue} (not in range 2-4)`);
      }
    }
  }

  // Sách đến hạn trong 1 ngày (gửi vào buổi sáng và tối)
  // Trong dev mode, bỏ điều kiện giờ để dễ test
  if (isDevMode || now.getHours() === 9 || now.getHours() === 18) {
    // Tìm tất cả borrows có dueDate trong khoảng 0.5 - 1.5 ngày từ bây giờ
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneDayBorrows = await Borrow.find({
      status: 'Borrowed',
      dueDate: {
        $gte: new Date(oneDayFromNow.getTime() - 12 * 60 * 60 * 1000), // 0.5 ngày
        $lte: new Date(oneDayFromNow.getTime() + 12 * 60 * 60 * 1000)  // 1.5 ngày
      }
    }).populate('book user');

    console.log(`Found ${oneDayBorrows.length} borrows due in ~1 day`);

    for (const borrow of oneDayBorrows) {
      const daysUntilDue = Math.ceil(
        (borrow.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Cho phép gửi nếu còn 0-2 ngày (linh hoạt hơn)
      if (daysUntilDue >= 0 && daysUntilDue <= 2) {
        console.log(`Sending 1-day reminder for borrow ${borrow._id}, daysUntilDue: ${daysUntilDue}, dueDate: ${borrow.dueDate}`);
        await sendDueDateReminderEmail((borrow._id as any).toString(), daysUntilDue);
      } else {
        console.log(`Skipping borrow ${borrow._id}, daysUntilDue: ${daysUntilDue} (not in range 0-2)`);
      }
    }
  }
}

/**
 * Gửi email cảnh báo quá hạn (mỗi ngày cho sách quá hạn)
 */
async function sendOverdueWarnings() {
  const now = new Date();
  
  // Tìm tất cả sách quá hạn (chưa trả)
  const overdueBorrows = await Borrow.find({
    status: { $in: ['Borrowed', 'Overdue'] },
    dueDate: { $lt: now }
  }).populate('book user');

  for (const borrow of overdueBorrows) {
    const daysOverdue = Math.floor(
      (now.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Gửi email cảnh báo mỗi ngày hoặc cách ngày (để tránh spam)
    // Chỉ gửi vào buổi sáng (9h) và nếu quá hạn >= 1 ngày
    if (daysOverdue >= 1 && (new Date().getHours() === 9 || daysOverdue % 2 === 0)) {
      await sendOverdueWarningEmail(
        (borrow._id as any).toString(),
        daysOverdue,
        borrow.lateFee || 0
      );
    }
  }

  console.log(`Sent overdue warnings for ${overdueBorrows.length} overdue borrows`);
}

/**
 * Expire reservations đã hết hạn
 */
async function expireReservations() {
  const now = new Date();
  const expiredReservations = await Reservation.updateMany(
    {
      status: 'Pending',
      expiresAt: { $lte: now }
    },
    {
      $set: { status: 'Expired' }
    }
  );

  if (expiredReservations.modifiedCount > 0) {
    console.log(`Expired ${expiredReservations.modifiedCount} reservations`);
  }
}

/**
 * Tự động chuyển phiếu mượn sang trạng thái Lost nếu quá hạn 30 ngày
 * Tính phí bồi thường 100% giá sách cho sách bị Lost
 */
async function autoMarkBorrowsAsLost(): Promise<{
  totalChecked: number;
  totalMarked: number;
  markedBorrows: Array<{
    borrowId: string;
    userId: string;
    bookId: string;
    daysOverdue: number;
    compensationFee: number;
  }>;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Tìm tất cả phiếu mượn quá hạn 30 ngày từ ngày bắt đầu mượn (borrowDate) và vẫn ở trạng thái Borrowed hoặc Overdue
  const overdueBorrows = await Borrow.find({
    status: { $in: ['Borrowed', 'Overdue'] },
    borrowDate: { $lt: thirtyDaysAgo } // Tính từ ngày bắt đầu mượn (borrowDate)
  }).populate('book user');

  const markedBorrows: Array<{
    borrowId: string;
    userId: string;
    bookId: string;
    daysOverdue: number;
    compensationFee: number;
  }> = [];

  // Xử lý từng phiếu mượn
  for (const borrow of overdueBorrows) {
    const book = borrow.book as any;
    const user = borrow.user as any;
    
    if (!book || !user) {
      continue;
    }

    // Tính số ngày từ ngày bắt đầu mượn (borrowDate)
    const daysOverdue = Math.floor((now.getTime() - borrow.borrowDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Chỉ đánh dấu Lost nếu >= 30 ngày từ ngày bắt đầu mượn
    if (daysOverdue < 30) {
      continue;
    }
    
    // Tính phí bồi thường = 100% giá sách
    const bookPrice = typeof book.price === 'number' && book.price > 0 ? book.price : 0;
    const compensationFee = bookPrice;

    try {
      // Cập nhật trạng thái phiếu mượn
      borrow.status = 'Lost';
      borrow.damageFee = compensationFee; // Lưu phí bồi thường vào damageFee
      borrow.notes = `Tự động chuyển sang Lost sau ${daysOverdue} ngày từ ngày bắt đầu mượn (${borrow.borrowDate.toLocaleDateString('vi-VN')})`;
      await borrow.save();

      // Cập nhật nợ cho user
      if (compensationFee > 0) {
        user.debt = (user.debt || 0) + compensationFee + (borrow.lateFee || 0);
        user.debtLastUpdated = new Date();
        user.totalSpent += compensationFee + (borrow.lateFee || 0);
        await user.save();
      }

      // Giảm stock của sách (vì sách bị mất)
      await Book.updateOne(
        { _id: book._id },
        { $inc: { stock: -1 } }
      );

      // Cập nhật BookCopy nếu có
      if (borrow.bookCopy) {
        await BookCopy.updateOne(
          { _id: borrow.bookCopy },
          { status: 'lost', isActive: false }
        );
      }
      
      // Push thông tin vào kết quả
      markedBorrows.push({
        borrowId: (borrow._id as any).toString(),
        userId: user._id.toString(),
        bookId: book._id.toString(),
        daysOverdue,
        compensationFee
      });

      console.log(`Marked borrow ${borrow._id} as Lost. Days overdue: ${daysOverdue}, Compensation: ${compensationFee} VNĐ`);
    } catch (error) {
      console.error(`Error marking borrow ${borrow._id} as Lost:`, error);
    }
  }

  return {
    totalChecked: overdueBorrows.length,
    totalMarked: markedBorrows.length,
    markedBorrows
  };
}

