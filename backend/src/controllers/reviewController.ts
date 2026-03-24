import { Request, Response } from 'express';
import {
  createReview as createReviewService,
  updateReview as updateReviewService,
  deleteReview as deleteReviewService,
  getBookReviews as getBookReviewsService,
  getUserReviews as getUserReviewsService,
  getReviewsForAdmin as getReviewsForAdminService,
  moderateReview as moderateReviewService
} from '../services/reviewService';
import mongoose from 'mongoose';
import Review, { ReviewStatus } from '../models/Review';
import Book from '../models/Book';

interface AuthRequest extends Request {
  user?: any;
}

// GET /reviews/average-rating - public average rating
export const getGlobalAverageRating = async (_req: Request, res: Response) => {
  try {
    const result = await Review.aggregate([
      { $match: { status: 'Approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const averageRating = result[0]?.averageRating || 0;

    return res.status(200).json({
      success: true,
      data: {
        averageRating: Math.round(averageRating * 100) / 100
      }
    });
  } catch (error: any) {
    console.error('Error in getGlobalAverageRating:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * POST /api/reviews
 * Tạo đánh giá mới cho sách
 */
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { bookId, rating, comment } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID sách (bookId)'
      });
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải là số từ 1 đến 5'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }

    const review = await createReviewService(userId, bookId, rating, comment);

    return res.status(201).json({
      success: true,
      message: 'Đánh giá sách thành công',
      data: {
        review: {
          id: review._id,
          book: review.book,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          createdAt: review.createdAt
        }
      }
    });
  } catch (error: any) {
    console.error('Error in createReview:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi tạo đánh giá'
    });
  }
};

/**
 * PUT /api/reviews/:id
 * Cập nhật đánh giá
 */
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đánh giá không hợp lệ'
      });
    }

    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải là số từ 1 đến 5'
      });
    }

    if (comment !== undefined && typeof comment !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Bình luận phải là chuỗi ký tự'
      });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Bình luận không được vượt quá 1000 ký tự'
      });
    }

    const review = await updateReviewService(id, userId, rating, comment);

    return res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: {
        review: {
          id: review._id,
          book: review.book,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          updatedAt: review.updatedAt
        }
      }
    });
  } catch (error: any) {
    console.error('Error in updateReview:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật đánh giá'
    });
  }
};

/**
 * DELETE /api/reviews/:id
 * Xóa đánh giá
 */
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đánh giá không hợp lệ'
      });
    }

    await deleteReviewService(id, userId);

    return res.json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error: any) {
    console.error('Error in deleteReview:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi xóa đánh giá'
    });
  }
};

/**
 * GET /api/reviews/book/:bookId
 * Lấy danh sách đánh giá của một sách
 */
export const getBookReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    // Try to find book by ID or slug to get the actual ObjectId
    let actualBookId = bookId;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      // Try to find by slug
      const book = await Book.findOne({ slug: bookId }).select('_id');
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Sách không tồn tại'
        });
      }
      actualBookId = (book._id as mongoose.Types.ObjectId).toString();
    }

    const validSortBy = ['newest', 'oldest', 'highest', 'lowest'];
    if (!validSortBy.includes(sortBy as string)) {
      return res.status(400).json({
        success: false,
        message: `sortBy phải là một trong: ${validSortBy.join(', ')}`
      });
    }

    const result = await getBookReviewsService(
      actualBookId,
      Number(page),
      Number(limit),
      sortBy as 'newest' | 'oldest' | 'highest' | 'lowest'
    );

    return res.json({
      success: true,
      data: {
        reviews: result.reviews.map(review => ({
          id: review._id,
          user: {
            id: (review.user as any)._id,
            fullName: (review.user as any).fullName,
            avatar: (review.user as any).avatar
          },
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        })),
        pagination: {
          page: result.page,
          limit: Number(limit),
          total: result.total,
          totalPages: result.totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getBookReviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách đánh giá'
    });
  }
};

/**
 * GET /api/reviews/me
 * Lấy danh sách đánh giá của user hiện tại
 */
export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10 } = req.query;

    const result = await getUserReviewsService(userId, Number(page), Number(limit));

    return res.json({
      success: true,
      data: {
        reviews: result.reviews.map(review => ({
          id: review._id,
          book: {
            id: (review.book as any)._id,
            title: (review.book as any).title,
            coverImage: (review.book as any).coverImage,
            authorId: (review.book as any).authorId,
            category: (review.book as any).category
          },
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          moderationNote: review.moderationNote,
          moderatedAt: review.moderatedAt,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        })),
        pagination: {
          page: result.page,
          limit: Number(limit),
          total: result.total,
          totalPages: result.totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getMyReviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách đánh giá'
    });
  }
};

const REVIEW_STATUS_VALUES = ['Pending', 'Approved', 'Rejected'];

/**
 * GET /api/admin/reviews
 * Admin xem danh sách đánh giá (lọc theo trạng thái)
 */
export const getAdminReviews = async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      bookId,
      userId,
      ratingFrom,
      ratingTo,
      search,
      page: pageQuery = '1',
      limit: limitQuery = '10'
    } = req.query as {
      status?: string;
      bookId?: string;
      userId?: string;
      ratingFrom?: string;
      ratingTo?: string;
      search?: string;
      page?: string;
      limit?: string;
    };

    if (status && !REVIEW_STATUS_VALUES.includes(status as string)) {
      return res.status(400).json({
        success: false,
        message: `status phải là một trong: ${REVIEW_STATUS_VALUES.join(', ')}`
      });
    }

    const parsedRatingFrom =
      ratingFrom !== undefined && ratingFrom !== ''
        ? Number(ratingFrom)
        : undefined;
    if (parsedRatingFrom !== undefined && (isNaN(parsedRatingFrom) || parsedRatingFrom < 1 || parsedRatingFrom > 5)) {
      return res.status(400).json({
        success: false,
        message: 'ratingFrom phải là số từ 1 đến 5'
      });
    }

    const parsedRatingTo =
      ratingTo !== undefined && ratingTo !== ''
        ? Number(ratingTo)
        : undefined;
    if (parsedRatingTo !== undefined && (isNaN(parsedRatingTo) || parsedRatingTo < 1 || parsedRatingTo > 5)) {
      return res.status(400).json({
        success: false,
        message: 'ratingTo phải là số từ 1 đến 5'
      });
    }

    const pageNumber = Number(pageQuery);
    const limitNumber = Number(limitQuery);

    if (!Number.isFinite(pageNumber) || pageNumber < 1) {
      return res.status(400).json({
        success: false,
        message: 'page phải là số nguyên dương'
      });
    }

    if (!Number.isFinite(limitNumber) || limitNumber < 1 || limitNumber > 100) {
      return res.status(400).json({
        success: false,
        message: 'limit phải nằm trong khoảng 1-100'
      });
    }

    const statusFilter = status as ReviewStatus | undefined;

    const result = await getReviewsForAdminService({
      status: statusFilter,
      bookId: bookId || undefined,
      userId: userId || undefined,
      ratingFrom: parsedRatingFrom,
      ratingTo: parsedRatingTo,
      search,
      page: pageNumber,
      limit: limitNumber
    });

    return res.json({
      success: true,
      data: {
        reviews: result.reviews.map(review => ({
          id: review._id,
          book: (review.book && (review.book as any)._id)
            ? {
                id: (review.book as any)._id,
                title: (review.book as any).title,
                coverImage: (review.book as any).coverImage
              }
            : review.book,
          user: (review.user && (review.user as any)._id)
            ? {
                id: (review.user as any)._id,
                fullName: (review.user as any).fullName,
                email: (review.user as any).email
              }
            : review.user,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          moderationNote: review.moderationNote,
          moderatedAt: review.moderatedAt,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        })),
        pagination: {
          page: result.page,
          limit: limitNumber,
          total: result.total,
          totalPages: result.totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getAdminReviews:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách đánh giá'
    });
  }
};

/**
 * POST /api/admin/reviews/:id/approve
 */
export const approveReview = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { note } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const review = await moderateReviewService(id, adminId, 'approve', note);

    return res.json({
      success: true,
      message: 'Đã duyệt đánh giá',
      data: {
        review: {
          id: review._id,
          book: review.book,
          user: review.user,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          moderationNote: review.moderationNote,
          moderatedAt: review.moderatedAt,
          updatedAt: review.updatedAt
        }
      }
    });
  } catch (error: any) {
    console.error('Error in approveReview:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi duyệt đánh giá'
    });
  }
};

/**
 * POST /api/admin/reviews/:id/reject
 */
export const rejectReview = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { note } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const review = await moderateReviewService(id, adminId, 'reject', note);

    return res.json({
      success: true,
      message: 'Đã từ chối đánh giá',
      data: {
        review: {
          id: review._id,
          book: review.book,
          user: review.user,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          moderationNote: review.moderationNote,
          moderatedAt: review.moderatedAt,
          updatedAt: review.updatedAt
        }
      }
    });
  } catch (error: any) {
    console.error('Error in rejectReview:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi từ chối đánh giá'
    });
  }
};

