"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialOverview = getFinancialOverview;
const Payment_1 = __importDefault(require("../models/Payment"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
const User_1 = __importDefault(require("../models/User"));
const DebtPayment_1 = __importDefault(require("../models/DebtPayment"));
const debtService_1 = require("./debtService");
function resolveDateRange(options = {}) {
    const period = options.period ?? 'all';
    const now = new Date();
    let startDate;
    if (options.startDate && options.endDate) {
        return {
            period: 'all',
            startDate: new Date(options.startDate),
            endDate: new Date(options.endDate)
        };
    }
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
            startDate = undefined;
            break;
    }
    return { period, startDate, endDate: now };
}
function buildDateMatch(range, field) {
    const matcher = {};
    if (range.startDate) {
        matcher.$gte = range.startDate;
    }
    if (range.endDate) {
        matcher.$lte = range.endDate;
    }
    if (Object.keys(matcher).length === 0) {
        return {};
    }
    return { [field]: matcher };
}
async function getFinancialOverview(options = {}) {
    const range = resolveDateRange(options);
    // Build matches
    const paymentMatch = {
        status: { $in: ['Succeeded', 'Failed', 'Canceled', 'Pending'] }
    };
    Object.assign(paymentMatch, buildDateMatch(range, 'createdAt'));
    const succeededPaymentMatch = {
        status: 'Succeeded',
        ...buildDateMatch(range, 'createdAt')
    };
    const borrowMatch = buildDateMatch(range, 'createdAt');
    const debtPaymentMatch = buildDateMatch(range, 'createdAt');
    // Revenue aggregates
    const [paymentByType, paymentStatus, paymentTimeline] = await Promise.all([
        Payment_1.default.aggregate([
            { $match: succeededPaymentMatch },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]),
        Payment_1.default.aggregate([
            { $match: paymentMatch },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]),
        Payment_1.default.aggregate([
            { $match: succeededPaymentMatch },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])
    ]);
    const revenueTotalAmount = paymentByType.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const revenueTotalCount = paymentByType.reduce((sum, item) => sum + (item.count || 0), 0);
    const revenueByType = {};
    paymentByType.forEach(item => {
        revenueByType[item._id || 'Unknown'] = {
            amount: item.totalAmount || 0,
            count: item.count || 0
        };
    });
    const statusBreakdown = {};
    paymentStatus.forEach(item => {
        statusBreakdown[item._id || 'Unknown'] = item.count || 0;
    });
    // Fines & borrows
    const [fineStats, borrowFeeCount, overdueBorrows] = await Promise.all([
        Borrow_1.default.aggregate([
            { $match: borrowMatch },
            {
                $group: {
                    _id: null,
                    totalLateFee: { $sum: '$lateFee' },
                    totalDamageFee: { $sum: '$damageFee' }
                }
            }
        ]),
        Borrow_1.default.countDocuments({
            ...borrowMatch,
            $or: [{ lateFee: { $gt: 0 } }, { damageFee: { $gt: 0 } }]
        }),
        Borrow_1.default.countDocuments({
            ...borrowMatch,
            status: 'Overdue'
        })
    ]);
    const finesTotals = fineStats[0] || { totalLateFee: 0, totalDamageFee: 0 };
    // Debt stats from users
    const debtAggregates = await User_1.default.aggregate([
        {
            $group: {
                _id: null,
                totalDebt: { $sum: '$debt' },
                averageDebt: { $avg: '$debt' },
                debtorCount: {
                    $sum: {
                        $cond: [{ $gt: ['$debt', 0] }, 1, 0]
                    }
                },
                overLimitCount: {
                    $sum: {
                        $cond: [{ $gt: ['$debt', debtService_1.MAX_DEBT_ALLOWED] }, 1, 0]
                    }
                },
                maxDebt: { $max: '$debt' }
            }
        }
    ]);
    const debtOutstanding = debtAggregates[0] || {
        totalDebt: 0,
        averageDebt: 0,
        debtorCount: 0,
        overLimitCount: 0,
        maxDebt: 0
    };
    // Debt repayment stats
    const debtPayments = await DebtPayment_1.default.aggregate([
        { $match: debtPaymentMatch },
        {
            $group: {
                _id: '$method',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
    const debtRepaymentTotal = debtPayments.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const debtRepaymentCount = debtPayments.reduce((sum, item) => sum + (item.count || 0), 0);
    const debtByMethod = {};
    debtPayments.forEach(item => {
        debtByMethod[item._id || 'Unknown'] = item.totalAmount || 0;
    });
    // User financial stats
    const userFinancials = await User_1.default.aggregate([
        {
            $group: {
                _id: null,
                totalSpent: { $sum: '$totalSpent' },
                averageSpent: { $avg: '$totalSpent' },
                maxSpent: { $max: '$totalSpent' },
                minSpent: { $min: '$totalSpent' }
            }
        }
    ]);
    const financialStats = userFinancials[0] || {
        totalSpent: 0,
        averageSpent: 0,
        maxSpent: 0,
        minSpent: 0
    };
    const topSpenders = await User_1.default.find({ totalSpent: { $gt: 0 } })
        .sort({ totalSpent: -1 })
        .limit(5)
        .select('_id fullName email totalSpent')
        .lean();
    return {
        period: range.period,
        range: {
            startDate: range.startDate,
            endDate: range.endDate
        },
        revenue: {
            totalAmount: revenueTotalAmount,
            totalCount: revenueTotalCount,
            byType: revenueByType,
            statusBreakdown,
            timeline: paymentTimeline.map(item => ({
                date: item._id,
                amount: item.totalAmount,
                count: item.count
            }))
        },
        debt: {
            outstanding: {
                total: debtOutstanding.totalDebt || 0,
                average: debtOutstanding.averageDebt || 0,
                debtorCount: debtOutstanding.debtorCount || 0,
                overLimitCount: debtOutstanding.overLimitCount || 0,
                max: debtOutstanding.maxDebt || 0
            },
            repayments: {
                total: debtRepaymentTotal,
                count: debtRepaymentCount,
                byMethod: debtByMethod
            }
        },
        fines: {
            totalLateFee: finesTotals.totalLateFee || 0,
            totalDamageFee: finesTotals.totalDamageFee || 0,
            totalBorrowWithFees: borrowFeeCount,
            overdueBorrows
        },
        users: {
            totalSpent: financialStats.totalSpent || 0,
            averageSpent: financialStats.averageSpent || 0,
            maxSpent: financialStats.maxSpent || 0,
            minSpent: financialStats.minSpent || 0,
            topSpenders: topSpenders.map(user => ({
                userId: String(user._id),
                fullName: user.fullName,
                email: user.email,
                totalSpent: user.totalSpent
            }))
        }
    };
}
//# sourceMappingURL=financialReportService.js.map