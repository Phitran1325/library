"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = void 0;
const User_1 = __importDefault(require("../models/User"));
const Book_1 = __importDefault(require("../models/Book"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
const Reservation_1 = __importDefault(require("../models/Reservation"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Violation_1 = __importDefault(require("../models/Violation"));
const MembershipSubscription_1 = __importDefault(require("../models/MembershipSubscription"));
const Review_1 = __importDefault(require("../models/Review"));
/**
 * GET /api/admin/dashboard
 * Lấy dữ liệu tổng quan cho dashboard admin
 */
const getAdminDashboard = async (req, res) => {
    try {
        const now = new Date();
        const last7Days = new Date(now);
        last7Days.setDate(now.getDate() - 7);
        const last30Days = new Date(now);
        last30Days.setDate(now.getDate() - 30);
        // ========== 1. TỔNG QUAN HỆ THỐNG ==========
        const [totalUsers, totalBooks, totalBorrows, totalReservations, activeUsers, activeBooks, activeBorrows, overdueBorrows, pendingReservations] = await Promise.all([
            User_1.default.countDocuments(),
            Book_1.default.countDocuments(),
            Borrow_1.default.countDocuments(),
            Reservation_1.default.countDocuments(),
            User_1.default.countDocuments({ isActive: true }),
            Book_1.default.countDocuments({ isActive: true }),
            Borrow_1.default.countDocuments({ status: { $in: ['Borrowed', 'Overdue'] } }),
            Borrow_1.default.countDocuments({ status: 'Overdue' }),
            Reservation_1.default.countDocuments({ status: 'Pending' })
        ]);
        // ========== 2. HOẠT ĐỘNG MƯỢN SÁCH ==========
        const [borrowsByStatus, borrowsByType, newBorrowsLast30Days, returnedLast30Days, renewalStats] = await Promise.all([
            // Tình trạng mượn
            Borrow_1.default.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Theo loại mượn
            Borrow_1.default.aggregate([
                {
                    $group: {
                        _id: '$borrowType',
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Mượn mới 30 ngày
            Borrow_1.default.countDocuments({ borrowDate: { $gte: last30Days } }),
            // Trả 30 ngày
            Borrow_1.default.countDocuments({
                status: 'Returned',
                returnDate: { $gte: last30Days }
            }),
            // Thống kê gia hạn
            Borrow_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRenewals: { $sum: '$renewalCount' },
                        averageRenewals: { $avg: '$renewalCount' },
                        borrowsWithRenewals: {
                            $sum: {
                                $cond: [{ $gt: ['$renewalCount', 0] }, 1, 0]
                            }
                        }
                    }
                }
            ])
        ]);
        // ========== 3. TÀI CHÍNH ==========
        const [totalRevenue, revenueLast30Days, paymentsByType, feeStats, pendingPayments] = await Promise.all([
            // Tổng doanh thu
            Payment_1.default.aggregate([
                {
                    $match: { status: 'Succeeded' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]).then(res => res[0]?.total || 0),
            // Doanh thu 30 ngày
            Payment_1.default.aggregate([
                {
                    $match: {
                        status: 'Succeeded',
                        createdAt: { $gte: last30Days }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]).then(res => res[0]?.total || 0),
            // Doanh thu theo loại
            Payment_1.default.aggregate([
                {
                    $match: { status: 'Succeeded' }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        total: { $sum: '$amount' }
                    }
                }
            ]),
            // Phí phạt và nợ
            Borrow_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        totalLateFee: { $sum: '$lateFee' },
                        totalDamageFee: { $sum: '$damageFee' },
                        totalFees: { $sum: { $add: ['$lateFee', '$damageFee'] } },
                        unpaidLateFee: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $gt: ['$lateFee', 0] }, { $ne: ['$status', 'Returned'] }] },
                                    '$lateFee',
                                    0
                                ]
                            }
                        }
                    }
                }
            ]).then(res => ({
                totalLateFee: res[0]?.totalLateFee || 0,
                totalDamageFee: res[0]?.totalDamageFee || 0,
                totalFees: res[0]?.totalFees || 0,
                unpaidLateFee: res[0]?.unpaidLateFee || 0
            })),
            // Payment đang chờ
            Payment_1.default.countDocuments({ status: 'Pending' })
        ]);
        // ========== 4. NGƯỜI DÙNG ==========
        const [usersByRole, usersByStatus, usersWithMembership, newUsersLast30Days, activeSubscriptions] = await Promise.all([
            // Phân loại theo role
            User_1.default.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Phân loại theo status
            User_1.default.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Có membership
            User_1.default.countDocuments({
                membershipPlanId: { $exists: true, $ne: null }
            }),
            // User mới 30 ngày
            User_1.default.countDocuments({ createdAt: { $gte: last30Days } }),
            // Subscription đang active
            MembershipSubscription_1.default.countDocuments({ status: 'Active' })
        ]);
        // ========== 5. VI PHẠM ==========
        const [totalViolations, violationsLast30Days, violationsByType, violationsBySeverity] = await Promise.all([
            Violation_1.default.countDocuments(),
            Violation_1.default.countDocuments({ createdAt: { $gte: last30Days } }),
            Violation_1.default.aggregate([
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Violation_1.default.aggregate([
                {
                    $group: {
                        _id: '$severity',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        // ========== 6. XU HƯỚNG 7 NGÀY ==========
        const [userTrends, borrowTrends, revenueTrends] = await Promise.all([
            // Người dùng mới theo ngày
            User_1.default.aggregate([
                {
                    $match: { createdAt: { $gte: last7Days } }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]),
            // Mượn sách theo ngày
            Borrow_1.default.aggregate([
                {
                    $match: { borrowDate: { $gte: last7Days } }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$borrowDate' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]),
            // Doanh thu theo ngày
            Payment_1.default.aggregate([
                {
                    $match: {
                        status: 'Succeeded',
                        createdAt: { $gte: last7Days }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ])
        ]);
        // ========== BONUS: REVIEW & STOCK ==========
        const [totalReviews, pendingReviews, averageRating, stockStats, lowStockBooks] = await Promise.all([
            Review_1.default.countDocuments(),
            Review_1.default.countDocuments({ status: 'Pending' }),
            Review_1.default.aggregate([
                {
                    $match: { status: 'Approved' }
                },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating' }
                    }
                }
            ]).then(res => res[0]?.avgRating || 0),
            Book_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        totalStock: { $sum: '$stock' },
                        totalAvailable: { $sum: '$available' },
                        totalBorrowed: { $sum: { $subtract: ['$stock', '$available'] } }
                    }
                }
            ]),
            Book_1.default.countDocuments({
                isActive: true,
                stock: { $gt: 0 },
                $expr: { $lt: [{ $divide: ['$available', '$stock'] }, 0.1] }
            })
        ]);
        // ========== FORMAT DỮ LIỆU ==========
        const formatAggregateResult = (data) => {
            const result = {};
            data.forEach(item => {
                result[item._id] = item.count;
            });
            return result;
        };
        const roleStats = formatAggregateResult(usersByRole);
        const statusStats = formatAggregateResult(usersByStatus);
        const borrowStatusStats = formatAggregateResult(borrowsByStatus);
        const borrowTypeStats = formatAggregateResult(borrowsByType);
        const violationTypeStats = formatAggregateResult(violationsByType);
        const violationSeverityStats = formatAggregateResult(violationsBySeverity);
        const paymentTypeStats = {};
        paymentsByType.forEach((item) => {
            paymentTypeStats[item._id] = {
                count: item.count,
                total: item.total
            };
        });
        // ========== RESPONSE ==========
        res.status(200).json({
            success: true,
            data: {
                // 1. Tổng quan hệ thống
                overview: {
                    users: {
                        total: totalUsers,
                        active: activeUsers,
                        inactive: totalUsers - activeUsers
                    },
                    books: {
                        total: totalBooks,
                        active: activeBooks,
                        inactive: totalBooks - activeBooks,
                        totalStock: stockStats[0]?.totalStock || 0,
                        availableStock: stockStats[0]?.totalAvailable || 0,
                        borrowedStock: stockStats[0]?.totalBorrowed || 0,
                        lowStock: lowStockBooks
                    },
                    borrows: {
                        total: totalBorrows,
                        active: activeBorrows,
                        overdue: overdueBorrows
                    },
                    reservations: {
                        total: totalReservations,
                        pending: pendingReservations
                    }
                },
                // 2. Hoạt động mượn sách
                borrowing: {
                    byStatus: {
                        Borrowed: borrowStatusStats['Borrowed'] || 0,
                        Returned: borrowStatusStats['Returned'] || 0,
                        Overdue: borrowStatusStats['Overdue'] || 0,
                        Cancelled: borrowStatusStats['Cancelled'] || 0
                    },
                    byType: {
                        InLibrary: borrowTypeStats['InLibrary'] || 0,
                        TakeHome: borrowTypeStats['TakeHome'] || 0
                    },
                    renewals: {
                        total: renewalStats[0]?.totalRenewals || 0,
                        average: Math.round((renewalStats[0]?.averageRenewals || 0) * 100) / 100,
                        borrowsWithRenewals: renewalStats[0]?.borrowsWithRenewals || 0
                    },
                    recent: {
                        newLast30Days: newBorrowsLast30Days,
                        returnedLast30Days: returnedLast30Days
                    }
                },
                // 3. Tài chính
                financial: {
                    revenue: {
                        total: totalRevenue,
                        last30Days: revenueLast30Days
                    },
                    fees: {
                        totalLateFee: feeStats.totalLateFee,
                        totalDamageFee: feeStats.totalDamageFee,
                        total: feeStats.totalFees,
                        unpaidLateFee: feeStats.unpaidLateFee
                    },
                    byPaymentType: {
                        Membership: paymentTypeStats['Membership'] || { count: 0, total: 0 },
                        Rental: paymentTypeStats['Rental'] || { count: 0, total: 0 },
                        Debt: paymentTypeStats['Debt'] || { count: 0, total: 0 }
                    },
                    pendingPayments
                },
                // 4. Người dùng
                users: {
                    byRole: {
                        Admin: roleStats['Admin'] || 0,
                        Librarian: roleStats['Librarian'] || 0,
                        Reader: roleStats['Reader'] || 0
                    },
                    byStatus: {
                        Active: statusStats['Active'] || 0,
                        Suspended: statusStats['Suspended'] || 0,
                        Banned: statusStats['Banned'] || 0
                    },
                    membership: {
                        withMembership: usersWithMembership,
                        withoutMembership: totalUsers - usersWithMembership,
                        activeSubscriptions
                    },
                    newLast30Days: newUsersLast30Days
                },
                // 5. Vi phạm
                violations: {
                    total: totalViolations,
                    last30Days: violationsLast30Days,
                    byType: {
                        Overdue: violationTypeStats['Overdue'] || 0,
                        Damaged: violationTypeStats['Damaged'] || 0,
                        Lost: violationTypeStats['Lost'] || 0,
                        LateReturn: violationTypeStats['LateReturn'] || 0
                    },
                    bySeverity: {
                        Low: violationSeverityStats['Low'] || 0,
                        Medium: violationSeverityStats['Medium'] || 0,
                        High: violationSeverityStats['High'] || 0
                    }
                },
                // 6. Xu hướng 7 ngày
                trends: {
                    newUsers: userTrends,
                    newBorrows: borrowTrends,
                    revenue: revenueTrends
                },
                // Bonus: Reviews
                reviews: {
                    total: totalReviews,
                    pending: pendingReviews,
                    averageRating: Math.round(averageRating * 10) / 10
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting admin dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu dashboard',
            error: error.message
        });
    }
};
exports.getAdminDashboard = getAdminDashboard;
//# sourceMappingURL=adminDashboardController.js.map