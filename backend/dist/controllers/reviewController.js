"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectReview = exports.approveReview = exports.getAdminReviews = exports.getMyReviews = exports.getBookReviews = exports.deleteReview = exports.updateReview = exports.createReview = void 0;
const reviewService_1 = require("../services/reviewService");
const mongoose_1 = __importDefault(require("mongoose"));
const Book_1 = __importDefault(require("../models/Book"));
/**
 * POST /api/reviews
 * Tạo đánh giá mới cho sách
 */
const createReview = async (req, res) => {
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
        if (!mongoose_1.default.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                success: false,
                message: 'ID sách không hợp lệ'
            });
        }
        const review = await (0, reviewService_1.createReview)(userId, bookId, rating, comment);
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
    }
    catch (error) {
        console.error('Error in createReview:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi tạo đánh giá'
        });
    }
};
exports.createReview = createReview;
/**
 * PUT /api/reviews/:id
 * Cập nhật đánh giá
 */
const updateReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { rating, comment } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
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
        const review = await (0, reviewService_1.updateReview)(id, userId, rating, comment);
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
    }
    catch (error) {
        console.error('Error in updateReview:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật đánh giá'
        });
    }
};
exports.updateReview = updateReview;
/**
 * DELETE /api/reviews/:id
 * Xóa đánh giá
 */
const deleteReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID đánh giá không hợp lệ'
            });
        }
        await (0, reviewService_1.deleteReview)(id, userId);
        return res.json({
            success: true,
            message: 'Xóa đánh giá thành công'
        });
    }
    catch (error) {
        console.error('Error in deleteReview:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa đánh giá'
        });
    }
};
exports.deleteReview = deleteReview;
/**
 * GET /api/reviews/book/:bookId
 * Lấy danh sách đánh giá của một sách
 */
const getBookReviews = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
        // Try to find book by ID or slug to get the actual ObjectId
        let actualBookId = bookId;
        if (!mongoose_1.default.Types.ObjectId.isValid(bookId)) {
            // Try to find by slug
            const book = await Book_1.default.findOne({ slug: bookId }).select('_id');
            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: 'Sách không tồn tại'
                });
            }
            actualBookId = book._id.toString();
        }
        const validSortBy = ['newest', 'oldest', 'highest', 'lowest'];
        if (!validSortBy.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: `sortBy phải là một trong: ${validSortBy.join(', ')}`
            });
        }
        const result = await (0, reviewService_1.getBookReviews)(actualBookId, Number(page), Number(limit), sortBy);
        return res.json({
            success: true,
            data: {
                reviews: result.reviews.map(review => ({
                    id: review._id,
                    user: {
                        id: review.user._id,
                        fullName: review.user.fullName,
                        avatar: review.user.avatar
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
    }
    catch (error) {
        console.error('Error in getBookReviews:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách đánh giá'
        });
    }
};
exports.getBookReviews = getBookReviews;
/**
 * GET /api/reviews/me
 * Lấy danh sách đánh giá của user hiện tại
 */
const getMyReviews = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 10 } = req.query;
        const result = await (0, reviewService_1.getUserReviews)(userId, Number(page), Number(limit));
        return res.json({
            success: true,
            data: {
                reviews: result.reviews.map(review => ({
                    id: review._id,
                    book: {
                        id: review.book._id,
                        title: review.book.title,
                        coverImage: review.book.coverImage,
                        authorId: review.book.authorId,
                        category: review.book.category
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
    }
    catch (error) {
        console.error('Error in getMyReviews:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách đánh giá'
        });
    }
};
exports.getMyReviews = getMyReviews;
const REVIEW_STATUS_VALUES = ['Pending', 'Approved', 'Rejected'];
/**
 * GET /api/admin/reviews
 * Admin xem danh sách đánh giá (lọc theo trạng thái)
 */
const getAdminReviews = async (req, res) => {
    try {
        const { status, bookId, userId, ratingFrom, ratingTo, search, page: pageQuery = '1', limit: limitQuery = '10' } = req.query;
        if (status && !REVIEW_STATUS_VALUES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status phải là một trong: ${REVIEW_STATUS_VALUES.join(', ')}`
            });
        }
        const parsedRatingFrom = ratingFrom !== undefined && ratingFrom !== ''
            ? Number(ratingFrom)
            : undefined;
        if (parsedRatingFrom !== undefined && (isNaN(parsedRatingFrom) || parsedRatingFrom < 1 || parsedRatingFrom > 5)) {
            return res.status(400).json({
                success: false,
                message: 'ratingFrom phải là số từ 1 đến 5'
            });
        }
        const parsedRatingTo = ratingTo !== undefined && ratingTo !== ''
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
        const statusFilter = status;
        const result = await (0, reviewService_1.getReviewsForAdmin)({
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
                    book: (review.book && review.book._id)
                        ? {
                            id: review.book._id,
                            title: review.book.title,
                            coverImage: review.book.coverImage
                        }
                        : review.book,
                    user: (review.user && review.user._id)
                        ? {
                            id: review.user._id,
                            fullName: review.user.fullName,
                            email: review.user.email
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
    }
    catch (error) {
        console.error('Error in getAdminReviews:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách đánh giá'
        });
    }
};
exports.getAdminReviews = getAdminReviews;
/**
 * POST /api/admin/reviews/:id/approve
 */
const approveReview = async (req, res) => {
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
        const review = await (0, reviewService_1.moderateReview)(id, adminId, 'approve', note);
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
    }
    catch (error) {
        console.error('Error in approveReview:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi duyệt đánh giá'
        });
    }
};
exports.approveReview = approveReview;
/**
 * POST /api/admin/reviews/:id/reject
 */
const rejectReview = async (req, res) => {
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
        const review = await (0, reviewService_1.moderateReview)(id, adminId, 'reject', note);
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
    }
    catch (error) {
        console.error('Error in rejectReview:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi từ chối đánh giá'
        });
    }
};
exports.rejectReview = rejectReview;
//# sourceMappingURL=reviewController.js.map