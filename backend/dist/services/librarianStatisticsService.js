"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLibrarianPersonalStatistics = getLibrarianPersonalStatistics;
exports.getLibrarianActivityHistory = getLibrarianActivityHistory;
const mongoose_1 = __importDefault(require("mongoose"));
const Book_1 = __importDefault(require("../models/Book"));
const BookCopy_1 = __importDefault(require("../models/BookCopy"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
const Reservation_1 = __importDefault(require("../models/Reservation"));
const Violation_1 = __importDefault(require("../models/Violation"));
/**
 * Tính toán khoảng thời gian
 */
function getTimePeriod(period) {
    const now = new Date();
    let startDate;
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
async function getLibrarianPersonalStatistics(librarianId, period = 'all') {
    const timePeriod = getTimePeriod(period);
    // Tính toán các khoảng thời gian cho timeline
    const todayPeriod = getTimePeriod('today');
    const weekPeriod = getTimePeriod('week');
    const monthPeriod = getTimePeriod('month');
    // 1. Thống kê sách (dựa trên createdAt - không track được ai tạo)
    const booksQuery = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
    const totalBooksCreated = await Book_1.default.countDocuments(booksQuery);
    const booksByCategory = await Book_1.default.aggregate([
        { $match: booksQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const newReleases = await Book_1.default.countDocuments({
        ...booksQuery,
        isNewRelease: true
    });
    // 2. Thống kê bản sao (dựa trên createdAt)
    const bookCopiesQuery = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
    const totalBookCopiesCreated = await BookCopy_1.default.countDocuments(bookCopiesQuery);
    const bookCopiesByStatus = await BookCopy_1.default.aggregate([
        { $match: bookCopiesQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const bookCopiesByCondition = await BookCopy_1.default.aggregate([
        { $match: bookCopiesQuery },
        { $group: { _id: '$condition', count: { $sum: 1 } } }
    ]);
    // 3. Thống kê phiếu mượn (tổng hợp - không track được ai xử lý mượn/trả thông thường)
    const borrowsQuery = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
    const totalBorrows = await Borrow_1.default.countDocuments(borrowsQuery);
    const borrowsByStatus = await Borrow_1.default.aggregate([
        { $match: borrowsQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const borrowsByType = await Borrow_1.default.aggregate([
        { $match: borrowsQuery },
        { $group: { _id: '$borrowType', count: { $sum: 1 } } }
    ]);
    const overdueBorrows = await Borrow_1.default.countDocuments({
        ...borrowsQuery,
        status: 'Overdue'
    });
    const feesStats = await Borrow_1.default.aggregate([
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
    const reservationsQuery = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
    const totalReservations = await Reservation_1.default.countDocuments(reservationsQuery);
    const reservationsByStatus = await Reservation_1.default.aggregate([
        { $match: reservationsQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    // 5. Thống kê vi phạm (tổng hợp)
    const violationsQuery = { createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate } };
    const totalViolations = await Violation_1.default.countDocuments(violationsQuery);
    const violationsByType = await Violation_1.default.aggregate([
        { $match: violationsQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const violationsBySeverity = await Violation_1.default.aggregate([
        { $match: violationsQuery },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    // 6. Thống kê với tracking (chỉ các hành động do thủ thư này thực hiện)
    const processedBorrowsQuery = {
        processedBy: new mongoose_1.default.Types.ObjectId(librarianId),
        createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate }
    };
    const totalBooksMarkedLost = await Borrow_1.default.countDocuments({
        ...processedBorrowsQuery,
        status: 'Lost'
    });
    const totalBooksMarkedDamaged = await Borrow_1.default.countDocuments({
        ...processedBorrowsQuery,
        status: 'Damaged'
    });
    const processedFeesStats = await Borrow_1.default.aggregate([
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
    const rejectedReservationsQuery = {
        rejectedBy: new mongoose_1.default.Types.ObjectId(librarianId),
        createdAt: { $gte: timePeriod.startDate, $lte: timePeriod.endDate }
    };
    const totalReservationsRejected = await Reservation_1.default.countDocuments({
        ...rejectedReservationsQuery,
        status: 'Rejected'
    });
    // 8. Thống kê vi phạm được ghi nhận (từ các borrow đã xử lý)
    const processedBorrowIds = await Borrow_1.default.find(processedBorrowsQuery).select('_id').lean();
    const borrowIds = processedBorrowIds.map(b => b._id);
    const violationsFromProcessed = borrowIds.length > 0
        ? await Violation_1.default.countDocuments({
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
            byCategory: booksByCategory.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            newReleases,
            createdInPeriod: totalBooksCreated
        },
        bookCopies: {
            totalCreated: totalBookCopiesCreated,
            byStatus: bookCopiesByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            byCondition: bookCopiesByCondition.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            createdInPeriod: totalBookCopiesCreated
        },
        borrows: {
            total: totalBorrows,
            byStatus: borrowsByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            byType: borrowsByType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            overdue: overdueBorrows,
            totalLateFees: feesStats[0]?.totalLateFees || 0,
            totalDamageFees: feesStats[0]?.totalDamageFees || 0
        },
        reservations: {
            total: totalReservations,
            byStatus: reservationsByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            rejected: totalReservationsRejected
        },
        violations: {
            total: totalViolations,
            byType: violationsByType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            bySeverity: violationsBySeverity.reduce((acc, item) => {
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
async function getTimelineStats(librarianId, period) {
    const processedBorrowsQuery = {
        processedBy: new mongoose_1.default.Types.ObjectId(librarianId),
        createdAt: { $gte: period.startDate, $lte: period.endDate }
    };
    const totalBooksMarkedLost = await Borrow_1.default.countDocuments({
        ...processedBorrowsQuery,
        status: 'Lost'
    });
    const totalBooksMarkedDamaged = await Borrow_1.default.countDocuments({
        ...processedBorrowsQuery,
        status: 'Damaged'
    });
    const rejectedReservationsQuery = {
        rejectedBy: new mongoose_1.default.Types.ObjectId(librarianId),
        createdAt: { $gte: period.startDate, $lte: period.endDate },
        status: 'Rejected'
    };
    const totalReservationsRejected = await Reservation_1.default.countDocuments(rejectedReservationsQuery);
    const processedFeesStats = await Borrow_1.default.aggregate([
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
async function getLibrarianActivityHistory(librarianId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    // Lấy các borrow đã xử lý
    const processedBorrows = await Borrow_1.default.find({
        processedBy: new mongoose_1.default.Types.ObjectId(librarianId)
    })
        .populate('book', 'title coverImage')
        .populate('user', 'fullName email')
        .sort({ updatedAt: -1 })
        .limit(limit * 2); // Lấy nhiều hơn để có thể kết hợp với reservations
    // Lấy các reservation đã từ chối
    const rejectedReservations = await Reservation_1.default.find({
        rejectedBy: new mongoose_1.default.Types.ObjectId(librarianId),
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
            createdAt: borrow.updatedAt || borrow.createdAt
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
            createdAt: reservation.updatedAt || reservation.createdAt
        }))
    ].sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
    });
    return activities.slice(0, limit);
}
//# sourceMappingURL=librarianStatisticsService.js.map