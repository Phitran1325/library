import mongoose from 'mongoose';
import Book from '../models/Book';
import BookCopy from '../models/BookCopy';
import Borrow from '../models/Borrow';
import Reservation from '../models/Reservation';
import Violation from '../models/Violation';

export interface TimePeriod {
  startDate: Date;
  endDate: Date;
}

export interface LibrarianStatistics {
  // Tổng quan
  overview: {
    totalBooksCreated: number;
    totalBookCopiesCreated: number;
    totalBooksMarkedLost: number;
    totalBooksMarkedDamaged: number;
    totalReservationsRejected: number;
    totalViolationsRecorded: number;
    totalLateFeesRecorded: number;
    totalDamageFeesRecorded: number;
  };
  
  // Thống kê sách
  books: {
    totalCreated: number;
    byCategory: { [category: string]: number };
    newReleases: number;
    createdInPeriod: number;
  };
  
  // Thống kê bản sao
  bookCopies: {
    totalCreated: number;
    byStatus: { [status: string]: number };
    byCondition: { [condition: string]: number };
    createdInPeriod: number;
  };
  
  // Thống kê phiếu mượn (tổng hợp)
  borrows: {
    total: number;
    byStatus: { [status: string]: number };
    byType: { [type: string]: number };
    overdue: number;
    totalLateFees: number;
    totalDamageFees: number;
  };
  
  // Thống kê đặt trước
  reservations: {
    total: number;
    byStatus: { [status: string]: number };
    rejected: number;
  };
  
  // Thống kê vi phạm
  violations: {
    total: number;
    byType: { [type: string]: number };
    bySeverity: { [severity: string]: number };
  };
  
  // Thống kê theo thời gian
  timeline: {
    today: Partial<LibrarianStatistics['overview']>;
    thisWeek: Partial<LibrarianStatistics['overview']>;
    thisMonth: Partial<LibrarianStatistics['overview']>;
  };
}

/**
 * Tính toán khoảng thời gian
 */
function getTimePeriod(period: 'today' | 'week' | 'month' | 'year' | 'all'): TimePeriod {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      startDate = new Date(0); // Epoch
      break;
  }
  
  return { startDate, endDate: now };
}

/**
 * Lấy thống kê cá nhân cho thủ thư
 */
export async function getLibrarianPersonalStatistics(
  librarianId: string,
  period: 'today' | 'week' | 'month' | 'year' | 'all' = 'all'
): Promise<LibrarianStatistics> {
  const timePeriod = getTimePeriod(period);
  
  // Tính toán các khoảng thời gian cho timeline
  const todayPeriod = getTimePeriod('today');
  const weekPeriod = getTimePeriod('week');
  const monthPeriod = getTimePeriod('month');
  
  // 1. Thống kê sách (dựa trên createdAt - không track được ai tạo)
  const booksQuery: any = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
  const totalBooksCreated = await Book.countDocuments(booksQuery);
  
  const booksByCategory = await Book.aggregate([
    { $match: booksQuery },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const newReleases = await Book.countDocuments({
    ...booksQuery,
    isNewRelease: true
  });
  
  // 2. Thống kê bản sao (dựa trên createdAt)
  const bookCopiesQuery: any = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
  const totalBookCopiesCreated = await BookCopy.countDocuments(bookCopiesQuery);
  
  const bookCopiesByStatus = await BookCopy.aggregate([
    { $match: bookCopiesQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const bookCopiesByCondition = await BookCopy.aggregate([
    { $match: bookCopiesQuery },
    { $group: { _id: '$condition', count: { $sum: 1 } } }
  ]);
  
  // 3. Thống kê phiếu mượn (tổng hợp - không track được ai xử lý mượn/trả thông thường)
  const borrowsQuery: any = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
  const totalBorrows = await Borrow.countDocuments(borrowsQuery);
  
  const borrowsByStatus = await Borrow.aggregate([
    { $match: borrowsQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const borrowsByType = await Borrow.aggregate([
    { $match: borrowsQuery },
    { $group: { _id: '$borrowType', count: { $sum: 1 } } }
  ]);
  
  const overdueBorrows = await Borrow.countDocuments({
    ...borrowsQuery,
    status: 'Overdue'
  });
  
  const feesStats = await Borrow.aggregate([
    { $match: borrowsQuery },
    {
      $group: {
        _id: null,
        totalLateFees: { $sum: '$lateFee' },
        totalDamageFees: { $sum: '$damageFee' }
      }
    }
  ]);
  
  // 4. Thống kê đặt trước
  const reservationsQuery: any = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
  const totalReservations = await Reservation.countDocuments(reservationsQuery);
  
  const reservationsByStatus = await Reservation.aggregate([
    { $match: reservationsQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  // 5. Thống kê vi phạm (tổng hợp)
  const violationsQuery: any = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
  const totalViolations = await Violation.countDocuments(violationsQuery);
  
  const violationsByType = await Violation.aggregate([
    { $match: violationsQuery },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  
  const violationsBySeverity = await Violation.aggregate([
    { $match: violationsQuery },
    { $group: { _id: '$severity', count: { $sum: 1 } } }
  ]);
  
  // 6. Thống kê với tracking (chỉ các hành động do thủ thư này thực hiện)
  const processedBorrowsQuery: any = {
    processedBy: new mongoose.Types.ObjectId(librarianId),
    createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate }
  };
  
  const totalBooksMarkedLost = await Borrow.countDocuments({
    ...processedBorrowsQuery,
    status: 'Lost'
  });
  
  const totalBooksMarkedDamaged = await Borrow.countDocuments({
    ...processedBorrowsQuery,
    status: 'Damaged'
  });
  
  const processedFeesStats = await Borrow.aggregate([
    { $match: processedBorrowsQuery },
    {
      $group: {
        _id: null,
        totalLateFees: { $sum: '$lateFee' },
        totalDamageFees: { $sum: '$damageFee' }
      }
    }
  ]);
  
  // 7. Thống kê đặt trước bị từ chối
  const rejectedReservationsQuery: any = {
    rejectedBy: new mongoose.Types.ObjectId(librarianId),
    createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate }
  };
  
  const totalReservationsRejected = await Reservation.countDocuments({
    ...rejectedReservationsQuery,
    status: 'Rejected'
  });
  
  // 8. Thống kê vi phạm được ghi nhận (từ các borrow đã xử lý)
  const processedBorrowIds = await Borrow.find(processedBorrowsQuery).select('_id').lean();
  const borrowIds = processedBorrowIds.map(b => b._id);
  
  const violationsFromProcessed = borrowIds.length > 0 
    ? await Violation.countDocuments({
        borrowId: { $in: borrowIds },
        createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate }
      })
    : 0;
  
  // 9. Timeline statistics
  const todayStats = await getTimelineStats(librarianId, todayPeriod);
  const weekStats = await getTimelineStats(librarianId, weekPeriod);
  const monthStats = await getTimelineStats(librarianId, monthPeriod);
  
  // Format results
  return {
    overview: {
      totalBooksCreated,
      totalBookCopiesCreated,
      totalBooksMarkedLost,
      totalBooksMarkedDamaged,
      totalReservationsRejected,
      totalViolationsRecorded: violationsFromProcessed,
      totalLateFeesRecorded: processedFeesStats[0]?.totalLateFees || 0,
      totalDamageFeesRecorded: processedFeesStats[0]?.totalDamageFees || 0
    },
    books: {
      totalCreated: totalBooksCreated,
      byCategory: booksByCategory.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      newReleases,
      createdInPeriod: totalBooksCreated
    },
    bookCopies: {
      totalCreated: totalBookCopiesCreated,
      byStatus: bookCopiesByStatus.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCondition: bookCopiesByCondition.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      createdInPeriod: totalBookCopiesCreated
    },
    borrows: {
      total: totalBorrows,
      byStatus: borrowsByStatus.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: borrowsByType.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      overdue: overdueBorrows,
      totalLateFees: feesStats[0]?.totalLateFees || 0,
      totalDamageFees: feesStats[0]?.totalDamageFees || 0
    },
    reservations: {
      total: totalReservations,
      byStatus: reservationsByStatus.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      rejected: totalReservationsRejected
    },
    violations: {
      total: totalViolations,
      byType: violationsByType.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySeverity: violationsBySeverity.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    },
    timeline: {
      today: todayStats,
      thisWeek: weekStats,
      thisMonth: monthStats
    }
  };
}

/**
 * Lấy thống kê timeline cho một khoảng thời gian
 */
async function getTimelineStats(
  librarianId: string,
  period: TimePeriod
): Promise<Partial<LibrarianStatistics['overview']>> {
  const processedBorrowsQuery: any = {
    processedBy: new mongoose.Types.ObjectId(librarianId),
    createdAt: { $gte: period.startDate, $lte: period.endDate }
  };
  
  const totalBooksMarkedLost = await Borrow.countDocuments({
    ...processedBorrowsQuery,
    status: 'Lost'
  });
  
  const totalBooksMarkedDamaged = await Borrow.countDocuments({
    ...processedBorrowsQuery,
    status: 'Damaged'
  });
  
  const rejectedReservationsQuery: any = {
    rejectedBy: new mongoose.Types.ObjectId(librarianId),
    createdAt: { $gte: period.startDate, $lte: period.endDate },
    status: 'Rejected'
  };
  
  const totalReservationsRejected = await Reservation.countDocuments(rejectedReservationsQuery);
  
  const processedFeesStats = await Borrow.aggregate([
    { $match: processedBorrowsQuery },
    {
      $group: {
        _id: null,
        totalLateFees: { $sum: '$lateFee' },
        totalDamageFees: { $sum: '$damageFee' }
      }
    }
  ]);
  
  return {
    totalBooksMarkedLost,
    totalBooksMarkedDamaged,
    totalReservationsRejected,
    totalLateFeesRecorded: processedFeesStats[0]?.totalLateFees || 0,
    totalDamageFeesRecorded: processedFeesStats[0]?.totalDamageFees || 0
  };
}

/**
 * Lấy lịch sử hoạt động của thủ thư
 */
export async function getLibrarianActivityHistory(
  librarianId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  // Lấy các borrow đã xử lý
  const processedBorrows = await Borrow.find({
    processedBy: new mongoose.Types.ObjectId(librarianId)
  })
    .populate('book', 'title coverImage')
    .populate('user', 'fullName email')
    .sort({ updatedAt: -1 })
    .limit(limit * 2); // Lấy nhiều hơn để có thể kết hợp với reservations
  
  // Lấy các reservation đã từ chối
  const rejectedReservations = await Reservation.find({
    rejectedBy: new mongoose.Types.ObjectId(librarianId),
    status: 'Rejected'
  })
    .populate('book', 'title coverImage')
    .populate('user', 'fullName email')
    .sort({ updatedAt: -1 })
    .limit(limit * 2);
  
  // Kết hợp và sắp xếp
  const activities = [
    ...processedBorrows.map(borrow => ({
      type: borrow.status === 'Lost' ? 'mark_lost' : 'mark_damaged',
      action: borrow.status === 'Lost' ? 'Đánh dấu sách mất' : 'Đánh dấu sách hư hỏng',
      borrow: {
        id: borrow._id,
        book: borrow.book,
        user: borrow.user,
        lateFee: borrow.lateFee,
        damageFee: borrow.damageFee
      },
      createdAt: (borrow as any).updatedAt || (borrow as any).createdAt
    })),
    ...rejectedReservations.map(reservation => ({
      type: 'reject_reservation',
      action: 'Từ chối đặt trước',
      reservation: {
        id: reservation._id,
        book: reservation.book,
        user: reservation.user,
        reason: reservation.rejectionReason
      },
      createdAt: (reservation as any).updatedAt || (reservation as any).createdAt
    }))
  ].sort((a, b) => {
    const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return timeB - timeA;
  });
  
  return activities.slice(0, limit);
}

