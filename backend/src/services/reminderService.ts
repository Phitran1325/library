import Borrow from '../models/Borrow';
import BorrowReminder, { ReminderType, ReminderStatus } from '../models/BorrowReminder';
import User from '../models/User';
import Book from '../models/Book';
import { 
  sendDueDateReminderEmail, 
  sendOverdueWarningEmail,
  sendManualReminderEmail 
} from './emailService';
import { createNotification } from './notificationService';
import websocketService from './websocketService';
import mongoose from 'mongoose';

interface ReminderConfig {
  beforeDueDays: number[]; // [3, 1] = gửi 3 ngày trước và 1 ngày trước
  overdueInterval: number; // Gửi mỗi X ngày khi quá hạn (ví dụ: 1 = mỗi ngày, 2 = cách ngày)
  maxRemindersPerBorrow: number; // Số lần nhắc nhở tối đa cho mỗi borrow
}

const DEFAULT_CONFIG: ReminderConfig = {
  beforeDueDays: [3, 1], // Gửi 3 ngày trước và 1 ngày trước
  overdueInterval: 1, // Gửi mỗi ngày khi quá hạn
  maxRemindersPerBorrow: 10 // Tối đa 10 lần nhắc nhở
};

/**
 * Tạo reminder record trong database
 */
export async function createReminderRecord(
  borrowId: string,
  userId: string,
  type: ReminderType,
  scheduledDate: Date,
  daysUntilDue?: number,
  daysOverdue?: number
): Promise<IBorrowReminder> {
  // Kiểm tra xem đã có reminder tương tự chưa (tránh duplicate)
  const existingReminder = await BorrowReminder.findOne({
    borrow: borrowId,
    type,
    scheduledDate: {
      $gte: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000), // -1 ngày
      $lte: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000)  // +1 ngày
    },
    status: { $in: ['PENDING', 'SENT'] }
  }).lean<IBorrowReminder>();

  if (existingReminder) {
    return existingReminder;
  }

  const reminderDoc = await BorrowReminder.create({
    borrow: borrowId,
    user: userId,
    type,
    scheduledDate,
    daysUntilDue,
    daysOverdue,
    status: 'PENDING'
  });

  return reminderDoc.toObject<IBorrowReminder>();
}

/**
 * Gửi reminder (email + notification + websocket)
 */
export async function sendReminder(reminderId: string): Promise<{
  success: boolean;
  emailSent: boolean;
  notificationSent: boolean;
  websocketSent: boolean;
  error?: string;
}> {
  const reminder = await BorrowReminder.findById(reminderId)
    .populate('borrow')
    .populate('user');

  if (!reminder) {
    throw new Error('Không tìm thấy reminder');
  }

  const borrow = reminder.borrow as any;
  const user = reminder.user as any;

  // Kiểm tra borrow có tồn tại và chưa trả không
  if (!borrow || borrow.status === 'Returned') {
    await BorrowReminder.findByIdAndUpdate(reminderId, {
      status: 'FAILED',
      errorMessage: 'Sách đã được trả hoặc không tồn tại'
    });
    return {
      success: false,
      emailSent: false,
      notificationSent: false,
      websocketSent: false,
      error: 'Sách đã được trả'
    };
  }

  // Populate book để lấy thông tin sách
  const book = await Book.findById(borrow.book);
  if (!book) {
    await BorrowReminder.findByIdAndUpdate(reminderId, {
      status: 'FAILED',
      errorMessage: 'Không tìm thấy sách'
    });
    return {
      success: false,
      emailSent: false,
      notificationSent: false,
      websocketSent: false,
      error: 'Không tìm thấy sách'
    };
  }

  const results = {
    emailSent: false,
    notificationSent: false,
    websocketSent: false
  };

  let errorMessage: string | undefined;

  try {
    // 1. Gửi email
    if (reminder.type === 'BEFORE_DUE' && reminder.daysUntilDue !== undefined) {
      await sendDueDateReminderEmail(
        (borrow._id as any).toString(),
        reminder.daysUntilDue
      );
      results.emailSent = true;
    } else if (reminder.type === 'OVERDUE' && reminder.daysOverdue !== undefined) {
      await sendOverdueWarningEmail(
        (borrow._id as any).toString(),
        reminder.daysOverdue,
        borrow.lateFee || 0
      );
      results.emailSent = true;
    } else if (reminder.type === 'MANUAL') {
      await sendManualReminderEmail((borrow._id as any).toString());
      results.emailSent = true;
    }
  } catch (error: any) {
    errorMessage = `Email error: ${error.message}`;
    console.error('Error sending reminder email:', error);
  }

  try {
    // 2. Tạo notification trong database
    const notificationTitle = reminder.type === 'OVERDUE'
      ? `⚠️ Sách đã quá hạn: ${book.title}`
      : reminder.type === 'BEFORE_DUE'
      ? `📚 Nhắc nhở: ${book.title} sắp đến hạn`
      : `📚 Nhắc nhở trả sách: ${book.title}`;

    const notificationMessage = reminder.type === 'OVERDUE'
      ? `Cuốn sách "${book.title}" đã quá hạn ${reminder.daysOverdue} ngày. Vui lòng trả sách sớm nhất có thể.`
      : reminder.type === 'BEFORE_DUE'
      ? `Cuốn sách "${book.title}" sẽ đến hạn sau ${reminder.daysUntilDue} ngày. Vui lòng trả hoặc gia hạn đúng hạn.`
      : `Thư viện nhắc nhở bạn về cuốn sách "${book.title}". Vui lòng kiểm tra thông tin mượn sách.`;

    const notificationType = reminder.type === 'OVERDUE' 
      ? 'OVERDUE_WARNING' 
      : reminder.type === 'BEFORE_DUE'
      ? 'BORROW_REMINDER'
      : 'SYSTEM';

    await createNotification({
      userId: (user._id as any).toString(),
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      data: {
        borrowId: (borrow._id as any).toString(),
        bookId: (book._id as any).toString(),
        bookTitle: book.title,
        reminderType: reminder.type,
        daysUntilDue: reminder.daysUntilDue,
        daysOverdue: reminder.daysOverdue
      }
    });
    results.notificationSent = true;
  } catch (error: any) {
    if (!errorMessage) {
      errorMessage = `Notification error: ${error.message}`;
    }
    console.error('Error creating notification:', error);
  }

  try {
    // 3. Gửi WebSocket notification (real-time)
    const socket = (websocketService as any).connectedUsers?.get((user._id as any).toString());
    if (socket) {
      const notificationData = {
        type: 'BORROW_REMINDER',
        title: reminder.type === 'OVERDUE'
          ? `⚠️ Sách đã quá hạn: ${book.title}`
          : `📚 Nhắc nhở: ${book.title} sắp đến hạn`,
        message: reminder.type === 'OVERDUE'
          ? `Cuốn sách "${book.title}" đã quá hạn ${reminder.daysOverdue} ngày.`
          : `Cuốn sách "${book.title}" sẽ đến hạn sau ${reminder.daysUntilDue} ngày.`,
        data: {
          borrowId: (borrow._id as any).toString(),
          bookId: (book._id as any).toString(),
          reminderType: reminder.type
        }
      };
      socket.emit('notification', notificationData);
      results.websocketSent = true;
    }
  } catch (error: any) {
    if (!errorMessage) {
      errorMessage = `WebSocket error: ${error.message}`;
    }
    console.error('Error sending WebSocket notification:', error);
  }

  // Cập nhật reminder status
  const allSuccess = results.emailSent || results.notificationSent || results.websocketSent;
  await BorrowReminder.findByIdAndUpdate(reminderId, {
    status: allSuccess ? 'SENT' : 'FAILED',
    sentAt: new Date(),
    emailSent: results.emailSent,
    notificationSent: results.notificationSent,
    websocketSent: results.websocketSent,
    errorMessage: errorMessage || undefined,
    retryCount: reminder.retryCount + 1
  });

  return {
    success: allSuccess,
    ...results,
    error: errorMessage
  };
}

/**
 * Tạo reminders tự động cho các borrows sắp đến hạn
 */
export async function scheduleBeforeDueReminders(config: ReminderConfig = DEFAULT_CONFIG): Promise<number> {
  const now = new Date();
  let scheduledCount = 0;

  // Tìm tất cả borrows đang mượn (chưa trả)
  const activeBorrows = await Borrow.find({
    status: 'Borrowed',
    dueDate: { $gte: now } // Chưa đến hạn
  }).populate('user');

  for (const borrow of activeBorrows) {
    const user = borrow.user as any;
    if (!user) continue;

    const daysUntilDue = Math.ceil(
      (borrow.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Tạo reminders cho mỗi ngày trong config
    for (const daysBefore of config.beforeDueDays) {
      if (daysUntilDue === daysBefore) {
        const scheduledDate = new Date(now);
        scheduledDate.setHours(9, 0, 0, 0); // Gửi lúc 9h sáng

        try {
          await createReminderRecord(
            (borrow._id as any).toString(),
            (user._id as any).toString(),
            'BEFORE_DUE',
            scheduledDate,
            daysUntilDue
          );
          scheduledCount++;
        } catch (error: any) {
          // Ignore duplicate errors
          if (!error.message?.includes('duplicate')) {
            console.error('Error creating before-due reminder:', error);
          }
        }
      }
    }
  }

  return scheduledCount;
}

/**
 * Tạo reminders tự động cho các borrows quá hạn
 */
export async function scheduleOverdueReminders(config: ReminderConfig = DEFAULT_CONFIG): Promise<number> {
  const now = new Date();
  let scheduledCount = 0;

  // Tìm tất cả borrows quá hạn
  const overdueBorrows = await Borrow.find({
    status: { $in: ['Borrowed', 'Overdue'] },
    dueDate: { $lt: now } // Đã quá hạn
  }).populate('user');

  for (const borrow of overdueBorrows) {
    const user = borrow.user as any;
    if (!user) continue;

    const daysOverdue = Math.floor(
      (now.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Kiểm tra số lần reminder đã gửi cho borrow này
    const existingRemindersCount = await BorrowReminder.countDocuments({
      borrow: borrow._id,
      type: 'OVERDUE',
      status: 'SENT'
    });

    if (existingRemindersCount >= config.maxRemindersPerBorrow) {
      continue; // Đã gửi đủ số lần
    }

    // Gửi theo interval (ví dụ: mỗi ngày hoặc cách ngày)
    const shouldSend = daysOverdue > 0 && (daysOverdue % config.overdueInterval === 0);

    if (shouldSend) {
      // Kiểm tra xem đã gửi reminder cho ngày này chưa
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingReminder = await BorrowReminder.findOne({
        borrow: borrow._id,
        type: 'OVERDUE',
        scheduledDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: { $in: ['PENDING', 'SENT'] }
      });

      // Nếu đã có reminder cho hôm nay, bỏ qua
      if (existingReminder) {
        continue;
      }

      if (!existingReminder) {
        const scheduledDate = new Date(now);
        scheduledDate.setHours(9, 0, 0, 0); // Gửi lúc 9h sáng

        try {
          await createReminderRecord(
            (borrow._id as any).toString(),
            (user._id as any).toString(),
            'OVERDUE',
            scheduledDate,
            undefined,
            daysOverdue
          );
          scheduledCount++;
        } catch (error: any) {
          // Ignore duplicate errors
          if (!error.message?.includes('duplicate')) {
            console.error('Error creating overdue reminder:', error);
          }
        }
      }
    }
  }

  return scheduledCount;
}

/**
 * Gửi tất cả reminders đã đến lúc gửi
 */
export async function processPendingReminders(): Promise<{
  processed: number;
  success: number;
  failed: number;
}> {
  const now = new Date();
  
  // Tìm tất cả reminders đã đến lúc gửi
  const pendingReminders = await BorrowReminder.find({
    status: 'PENDING',
    scheduledDate: { $lte: now },
    retryCount: { $lt: 3 } // Chỉ thử lại tối đa 3 lần
  }).limit(100); // Giới hạn 100 reminders mỗi lần để tránh quá tải

  let processed = 0;
  let success = 0;
  let failed = 0;

  for (const reminder of pendingReminders) {
    try {
      const result = await sendReminder((reminder._id as any).toString());
      processed++;
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    } catch (error: any) {
      console.error(`Error processing reminder ${reminder._id}:`, error);
      await BorrowReminder.findByIdAndUpdate(reminder._id, {
        status: 'FAILED',
        errorMessage: error.message?.substring(0, 500),
        retryCount: reminder.retryCount + 1
      });
      processed++;
      failed++;
    }
  }

  return { processed, success, failed };
}

/**
 * Gửi reminder thủ công (từ librarian/admin)
 */
export async function sendManualReminder(
  borrowId: string,
  customMessage?: string
): Promise<{
  success: boolean;
  reminderId: string;
  emailSent: boolean;
  notificationSent: boolean;
  websocketSent: boolean;
}> {
  const borrow = await Borrow.findById(borrowId).populate('user');
  if (!borrow) {
    throw new Error('Không tìm thấy phiếu mượn');
  }

  const user = borrow.user as any;
  if (!user) {
    throw new Error('Không tìm thấy người dùng');
  }

  // Gửi email thủ công
  const emailResult = await sendManualReminderEmail(borrowId, customMessage);

  // Tạo reminder record
  const reminder = await BorrowReminder.create({
    borrow: borrowId,
    user: (user._id as any).toString(),
    type: 'MANUAL',
    scheduledDate: new Date(),
    status: 'SENT',
    sentAt: new Date(),
    emailSent: true,
    notificationSent: false,
    websocketSent: false
  });

  // Gửi notification
  const book = await Borrow.findById(borrowId).populate('book');
  const bookData = (book as any)?.book;
  
  let notificationSent = false;
  let websocketSent = false;

  try {
    await createNotification({
      userId: (user._id as any).toString(),
      title: '📚 Nhắc nhở trả sách',
      message: customMessage || `Thư viện nhắc nhở bạn về cuốn sách "${bookData?.title || 'đang mượn'}".`,
      type: 'SYSTEM',
      data: {
        borrowId,
        reminderType: 'MANUAL',
        customMessage
      }
    });
    notificationSent = true;
  } catch (error) {
    console.error('Error creating manual reminder notification:', error);
  }

  // Gửi WebSocket
  try {
    const socket = (websocketService as any).connectedUsers?.get((user._id as any).toString());
    if (socket) {
      socket.emit('notification', {
        type: 'BORROW_REMINDER',
        title: '📚 Nhắc nhở trả sách',
        message: customMessage || `Thư viện nhắc nhở bạn về cuốn sách "${bookData?.title || 'đang mượn'}".`,
        data: {
          borrowId,
          reminderType: 'MANUAL'
        }
      });
      websocketSent = true;
    }
  } catch (error) {
    console.error('Error sending manual reminder WebSocket:', error);
  }

  // Cập nhật reminder
  await BorrowReminder.findByIdAndUpdate(reminder._id, {
    notificationSent,
    websocketSent
  });

  return {
    success: true,
    reminderId: (reminder._id as any).toString(),
    emailSent: true,
    notificationSent,
    websocketSent
  };
}

// Export interface
export interface IBorrowReminder {
  _id: mongoose.Types.ObjectId;
  borrow: mongoose.Types.ObjectId | any;
  user: mongoose.Types.ObjectId | any;
  type: ReminderType;
  status: ReminderStatus;
  scheduledDate: Date;
  sentAt?: Date;
  daysUntilDue?: number;
  daysOverdue?: number;
  emailSent: boolean;
  notificationSent: boolean;
  websocketSent: boolean;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

