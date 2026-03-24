"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const Book_1 = __importDefault(require("../models/Book"));
const User_1 = __importDefault(require("../models/User"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
const Review_1 = __importDefault(require("../models/Review"));
/**
 * GET /api/dashboard/stats
 * Unified endpoint that combines data from 4 separate APIs:
 * - /api/books/count -> totalBooks
 * - /api/users/readers/count -> totalReaders
 * - /api/borrows/stats/last-30-days -> totalBorrowsLast30Days
 * - /api/reviews/average-rating -> averageRating
 */
const getDashboardStats = async (_req, res) => {
    try {
        // Calculate date for last 30 days
        const now = new Date();
        const last30Days = new Date(now);
        last30Days.setDate(now.getDate() - 30);
        // Execute all queries in parallel for better performance
        const [totalBooks, totalReaders, totalBorrowsLast30Days, ratingResult] = await Promise.all([
            // 1. Count total books
            Book_1.default.countDocuments(),
            // 2. Count total readers
            User_1.default.countDocuments({ role: 'Reader' }),
            // 3. Count borrows in last 30 days
            Borrow_1.default.countDocuments({
                borrowDate: { $gte: last30Days }
            }),
            // 4. Calculate average rating from approved reviews
            Review_1.default.aggregate([
                { $match: { status: 'Approved' } },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: '$rating' }
                    }
                }
            ])
        ]);
        // Extract average rating (default to 0 if no reviews)
        const averageRating = ratingResult[0]?.averageRating || 0;
        // Return unified response
        return res.status(200).json({
            success: true,
            data: {
                totalBooks,
                totalReaders,
                totalBorrowsLast30Days,
                averageRating: Math.round(averageRating * 100) / 100
            }
        });
    }
    catch (error) {
        console.error('Error in getDashboardStats:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboardController.js.map