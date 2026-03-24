import { Request, Response } from 'express';
import Book from '../models/Book';
import User from '../models/User';
import Borrow from '../models/Borrow';
import Review from '../models/Review';

/**
 * GET /api/dashboard/stats
 * Unified endpoint that combines data from 4 separate APIs:
 * - /api/books/count -> totalBooks
 * - /api/users/readers/count -> totalReaders
 * - /api/borrows/stats/last-30-days -> totalBorrowsLast30Days
 * - /api/reviews/average-rating -> averageRating
 */
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    // Calculate date for last 30 days
    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    // Execute all queries in parallel for better performance
    const [
      totalBooks,
      totalReaders,
      totalBorrowsLast30Days,
      ratingResult
    ] = await Promise.all([
      // 1. Count total books
      Book.countDocuments(),
      
      // 2. Count total readers
      User.countDocuments({ role: 'Reader' }),
      
      // 3. Count borrows in last 30 days
      Borrow.countDocuments({
        borrowDate: { $gte: last30Days }
      }),
      
      // 4. Calculate average rating from approved reviews
      Review.aggregate([
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
  } catch (error: any) {
    console.error('Error in getDashboardStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
