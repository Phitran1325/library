import mongoose, { Types } from 'mongoose';
import Borrow from '../models/Borrow';
import User from '../models/User';
import Violation, { ViolationType } from '../models/Violation';
import { VIOLATION_RULES } from '../utils/borrowingConstants';
import { addDays } from '../utils/borrowingConstants';

/**
 * Ghi nhận vi phạm và kiểm tra có cần suspend không
 */
export async function recordViolation(
  userId: string,
  type: ViolationType,
  borrowId: string,
  severity: 'Low' | 'Medium' | 'High' = 'Medium',
  description?: string
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  // Tạo violation record
  const violation = await Violation.create({
    user: userId,
    type,
    severity,
    borrowId,
    description: description || `Vi phạm ${type}`
  });

  // Tăng violation count
  user.violationCount = (user.violationCount || 0) + 1;
  await user.save();

  // Kiểm tra và suspend nếu cần
  await checkAndSuspendIfNeeded(userId);
}

/**
 * Kiểm tra và tự động suspend user nếu vi phạm quá nhiều
 */
async function checkAndSuspendIfNeeded(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user || user.status !== 'Active') {
    return; // Đã bị suspend hoặc banned rồi
  }

  const now = new Date();
  const monthsAgo = new Date(now);
  monthsAgo.setMonth(monthsAgo.getMonth() - VIOLATION_RULES.violationTrackingMonths);

  // Đếm số vi phạm trong khoảng thời gian
  const recentViolations = await Violation.countDocuments({
    user: userId,
    createdAt: { $gte: monthsAgo }
  });

  if (recentViolations >= VIOLATION_RULES.maxViolationsInMonths) {
    // Suspend user
    user.status = 'Suspended';
    user.canBorrow = false;
    user.suspendedUntil = addDays(now, VIOLATION_RULES.suspensionDaysAfterMaxViolations);
    user.suspensionReason = `Vi phạm ${recentViolations} lần trong ${VIOLATION_RULES.violationTrackingMonths} tháng`;
    await user.save();

    // Gửi email thông báo (có thể implement sau)
    console.log(`User ${userId} đã bị suspend đến ${user.suspendedUntil}`);
  }
}

/**
 * Kiểm tra và tự động mở khóa user đã hết thời gian suspend
 */
export async function checkAndAutoUnsuspend(): Promise<void> {
  const now = new Date();

  const suspendedUsers = await User.find({
    status: 'Suspended',
    suspendedUntil: { $lte: now }
  });

  for (const user of suspendedUsers) {
    user.status = 'Active';
    user.canBorrow = true;
    user.suspendedUntil = undefined;
    user.suspensionReason = undefined;
    await user.save();

    // Gửi email thông báo mở khóa (có thể implement sau)
    console.log(`User ${user._id} đã được tự động mở khóa`);
  }

  if (suspendedUsers.length > 0) {
    console.log(`Đã tự động mở khóa ${suspendedUsers.length} user`);
  }
}

/**
 * Kiểm tra và tự động suspend user có sách quá hạn quá lâu
 */
export async function checkAndAutoSuspendOverdue(): Promise<void> {
  const now = new Date();
  const autoSuspendDate = new Date(now.getTime() - VIOLATION_RULES.autoSuspendAfterDays * 24 * 60 * 60 * 1000);

  // Tìm user có sách quá hạn quá lâu
  const overdueBorrows = await Borrow.find({
    status: { $in: ['Borrowed', 'Overdue'] },
    dueDate: { $lt: autoSuspendDate }
  }).populate('user');

  const processedUsers = new Set<string>();

  for (const borrow of overdueBorrows) {
    const user = borrow.user as any;
    const userId = user._id.toString();

    if (processedUsers.has(userId)) {
      continue; // Đã xử lý user này rồi
    }

    if (user.status === 'Active') {
      await recordViolation(
        userId,
        'Overdue',
        (borrow._id as Types.ObjectId).toString(),
        'High',
        `Sách quá hạn quá ${VIOLATION_RULES.autoSuspendAfterDays} ngày`
      );
      processedUsers.add(userId);
    }
  }

  if (processedUsers.size > 0) {
    console.log(`Đã check và suspend ${processedUsers.size} user có sách quá hạn quá lâu`);
  }
}

/**
 * Tự động khóa quyền mượn của độc giả nếu họ trễ hạn quá 30 ngày
 * Chỉ khóa canBorrow, không suspend toàn bộ tài khoản
 */
export async function autoLockBorrowingPermissionForOverdue(): Promise<{
  totalChecked: number;
  totalLocked: number;
  lockedUsers: Array<{
    userId: string;
    email: string;
    fullName: string;
    maxDaysOverdue: number;
    overdueBorrows: number;
  }>;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Tìm tất cả sách quá hạn quá 30 ngày
  const overdueBorrows = await Borrow.find({
    status: { $in: ['Borrowed', 'Overdue'] },
    dueDate: { $lt: thirtyDaysAgo }
  }).populate('user');

  const userOverdueMap = new Map<string, {
    user: any;
    maxDaysOverdue: number;
    overdueCount: number;
  }>();

  // Nhóm theo user và tính số ngày trễ tối đa
  for (const borrow of overdueBorrows) {
    const user = borrow.user as any;
    if (!user) continue;

    const userId = user._id.toString();
    const daysOverdue = Math.floor((now.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (!userOverdueMap.has(userId)) {
      userOverdueMap.set(userId, {
        user,
        maxDaysOverdue: daysOverdue,
        overdueCount: 1
      });
    } else {
      const existing = userOverdueMap.get(userId)!;
      existing.maxDaysOverdue = Math.max(existing.maxDaysOverdue, daysOverdue);
      existing.overdueCount += 1;
    }
  }

  const lockedUsers: Array<{
    userId: string;
    email: string;
    fullName: string;
    maxDaysOverdue: number;
    overdueBorrows: number;
  }> = [];

  // Khóa quyền mượn cho các user có sách quá hạn >30 ngày
  for (const [userId, data] of userOverdueMap.entries()) {
    const { user, maxDaysOverdue, overdueCount } = data;

    // Chỉ xử lý user có role Reader và đang Active
    if (user.role !== 'Reader' || user.status !== 'Active') {
      continue;
    }

    // Chỉ khóa nếu chưa bị khóa và quá hạn >30 ngày
    if (user.canBorrow && maxDaysOverdue > 30) {
      user.canBorrow = false;
      await user.save();

      // Ghi nhận vi phạm cho mỗi sách quá hạn
      const userOverdueBorrows = overdueBorrows.filter(
        (b) => (b.user as any)?._id?.toString() === userId
      );

      for (const borrow of userOverdueBorrows) {
        try {
          await recordViolation(
            userId,
            'Overdue',
            (borrow._id as Types.ObjectId).toString(),
            'High',
            `Tự động khóa quyền mượn: sách quá hạn ${maxDaysOverdue} ngày (vượt quá 30 ngày)`
          );
        } catch (error) {
          console.error(`Error recording violation for user ${userId}, borrow ${borrow._id}:`, error);
        }
      }

      lockedUsers.push({
        userId,
        email: user.email,
        fullName: user.fullName,
        maxDaysOverdue,
        overdueBorrows: overdueCount
      });
    }
  }

  return {
    totalChecked: userOverdueMap.size,
    totalLocked: lockedUsers.length,
    lockedUsers
  };
}

/**
 * Tự động khóa quyền mượn khi độc giả có số tiền phạt vượt quá hạn mức cho phép
 * Tính tổng nợ phạt (lateFee + damageFee) từ tất cả các borrow chưa thanh toán
 */
export async function autoLockBorrowingPermissionForPenaltyDebt(): Promise<{
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
}> {
  // Lấy tất cả user có role Reader và đang Active
  const readers = await User.find({
    role: 'Reader',
    status: 'Active',
    canBorrow: true // Chỉ kiểm tra user chưa bị khóa
  });

  const lockedUsers: Array<{
    userId: string;
    email: string;
    fullName: string;
    totalPenaltyDebt: number;
    maxPenaltyDebt: number;
    borrowsWithPenalty: number;
  }> = [];

  // Kiểm tra từng user
  for (const user of readers) {
    // Tính tổng nợ phạt từ tất cả các borrow
    // Bao gồm: borrow đang quá hạn (chưa trả) và borrow đã trả nhưng chưa thanh toán phí
    const penaltyBorrows = await Borrow.aggregate([
      {
        $match: {
          user: user._id,
          $or: [
            // Borrow đang quá hạn (chưa trả)
            {
              status: { $in: ['Borrowed', 'Overdue'] },
              dueDate: { $lt: new Date() }
            },
            // Borrow đã trả nhưng có phí phạt chưa thanh toán
            {
              status: 'Returned',
              $or: [
                { lateFee: { $gt: 0 } },
                { damageFee: { $gt: 0 } }
              ]
            }
          ]
        }
      },
      {
        $project: {
          totalPenalty: {
            $add: ['$lateFee', '$damageFee']
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPenaltyDebt: { $sum: '$totalPenalty' },
          borrowsCount: { $sum: 1 }
        }
      }
    ]);

    const totalPenaltyDebt = penaltyBorrows.length > 0 
      ? (penaltyBorrows[0].totalPenaltyDebt || 0)
      : 0;

    const borrowsWithPenalty = penaltyBorrows.length > 0
      ? (penaltyBorrows[0].borrowsCount || 0)
      : 0;

    // Kiểm tra nếu tổng nợ phạt vượt quá hạn mức
    if (totalPenaltyDebt > VIOLATION_RULES.maxPenaltyDebt) {
      // Khóa quyền mượn
      user.canBorrow = false;
      await user.save();

      // Ghi nhận vi phạm
      try {
        // Tìm một borrow có phí phạt để ghi nhận vi phạm
        const borrowWithPenalty = await Borrow.findOne({
          user: user._id,
          $or: [
            {
              status: { $in: ['Borrowed', 'Overdue'] },
              dueDate: { $lt: new Date() },
              $or: [
                { lateFee: { $gt: 0 } },
                { damageFee: { $gt: 0 } }
              ]
            },
            {
              status: 'Returned',
              $or: [
                { lateFee: { $gt: 0 } },
                { damageFee: { $gt: 0 } }
              ]
            }
          ]
        }).sort({ createdAt: -1 });

        if (borrowWithPenalty) {
          await recordViolation(
            (user._id as mongoose.Types.ObjectId).toString(),
            'Overdue',
            (borrowWithPenalty._id as Types.ObjectId).toString(),
            'High',
            `Tự động khóa quyền mượn: nợ phạt ${totalPenaltyDebt.toLocaleString('vi-VN')} VNĐ vượt quá hạn mức ${VIOLATION_RULES.maxPenaltyDebt.toLocaleString('vi-VN')} VNĐ`
          );
        }
      } catch (error) {
        console.error(`Error recording violation for user ${user._id}:`, error);
      }

      lockedUsers.push({
        userId: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        fullName: user.fullName,
        totalPenaltyDebt,
        maxPenaltyDebt: VIOLATION_RULES.maxPenaltyDebt,
        borrowsWithPenalty
      });
    }
  }

  return {
    totalChecked: readers.length,
    totalLocked: lockedUsers.length,
    lockedUsers
  };
}

