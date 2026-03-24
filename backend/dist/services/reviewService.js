"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUserReviewBook = canUserReviewBook;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
exports.updateBookRating = updateBookRating;
exports.getBookReviews = getBookReviews;
exports.getUserReviews = getUserReviews;
exports.getReviewsForAdmin = getReviewsForAdmin;
exports.moderateReview = moderateReview;
const mongoose_1 = __importDefault(require("mongoose"));
const Review_1 = __importDefault(require("../models/Review"));
const Book_1 = __importDefault(require("../models/Book"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
/**
 * Kiểm tra user đã mượn và trả sách chưa
 */
async function canUserReviewBook(userId, bookId) {
    // Kiểm tra xem user đã có ít nhất 1 lần mượn và trả sách này chưa
    const returnedBorrow = await Borrow_1.default.findOne({
        user: userId,
        book: bookId,
        status: 'Returned'
    });
    if (!returnedBorrow) {
        return {
            canReview: false,
            message: 'Bạn chỉ có thể đánh giá sách sau khi đã mượn và trả sách'
        };
    }
    // Kiểm tra xem user đã đánh giá sách này chưa
    const existingReview = await Review_1.default.findOne({
        user: userId,
        book: bookId
    });
    if (existingReview) {
        return {
            canReview: false,
            message: 'Bạn đã đánh giá sách này rồi. Bạn có thể cập nhật đánh giá của mình'
        };
    }
    return { canReview: true };
}
/**
 * Tạo review mới
 */
async function createReview(userId, bookId, rating, comment) {
    // Kiểm tra quyền đánh giá
    const permissionCheck = await canUserReviewBook(userId, bookId);
    if (!permissionCheck.canReview) {
        throw new Error(permissionCheck.message);
    }
    // Kiểm tra sách tồn tại
    const book = await Book_1.default.findById(bookId);
    if (!book) {
        throw new Error('Sách không tồn tại');
    }
    // Tạo review
    const review = new Review_1.default({
        user: userId,
        book: bookId,
        rating,
        comment: comment?.trim(),
        status: 'Pending'
    });
    await review.save();
    // Cập nhật rating và reviewCount của sách
    await updateBookRating(bookId);
    return review;
}
/**
 * Cập nhật review
 */
async function updateReview(reviewId, userId, rating, comment) {
    const review = await Review_1.default.findById(reviewId);
    if (!review) {
        throw new Error('Đánh giá không tồn tại');
    }
    // Kiểm tra quyền sở hữu
    if (review.user.toString() !== userId) {
        throw new Error('Bạn không có quyền cập nhật đánh giá này');
    }
    // Cập nhật các trường
    if (rating !== undefined) {
        review.rating = rating;
    }
    if (comment !== undefined) {
        review.comment = comment.trim() || undefined;
    }
    // Khi người dùng chỉnh sửa, cần kiểm duyệt lại
    const wasApproved = review.status === 'Approved';
    review.status = 'Pending';
    review.moderatedBy = undefined;
    review.moderatedAt = undefined;
    review.moderationNote = undefined;
    await review.save();
    // Nếu review trước đó đã được duyệt, cần cập nhật lại rating
    if (wasApproved) {
        await updateBookRating(review.book.toString());
    }
    return review;
}
/**
 * Xóa review
 */
async function deleteReview(reviewId, userId) {
    const review = await Review_1.default.findById(reviewId);
    if (!review) {
        throw new Error('Đánh giá không tồn tại');
    }
    // Kiểm tra quyền sở hữu
    if (review.user.toString() !== userId) {
        throw new Error('Bạn không có quyền xóa đánh giá này');
    }
    const bookId = review.book.toString();
    const wasApproved = review.status === 'Approved';
    await Review_1.default.findByIdAndDelete(reviewId);
    if (wasApproved) {
        await updateBookRating(bookId);
    }
}
/**
 * Cập nhật rating và reviewCount của sách dựa trên tất cả reviews
 */
async function updateBookRating(bookId) {
    const reviews = await Review_1.default.find({ book: bookId, status: 'Approved' });
    if (reviews.length === 0) {
        // Nếu không có review nào, đặt rating = 0 và reviewCount = 0
        await Book_1.default.findByIdAndUpdate(bookId, {
            rating: 0,
            reviewCount: 0
        });
        return;
    }
    // Tính rating trung bình
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    // Làm tròn đến 1 chữ số thập phân
    const roundedRating = Math.round(averageRating * 10) / 10;
    // Cập nhật sách
    await Book_1.default.findByIdAndUpdate(bookId, {
        rating: roundedRating,
        reviewCount: reviews.length
    });
}
/**
 * Lấy danh sách reviews của một sách
 */
async function getBookReviews(bookId, page = 1, limit = 10, sortBy = 'newest') {
    const skip = (page - 1) * limit;
    // Xây dựng sort object
    let sort = {};
    switch (sortBy) {
        case 'newest':
            sort = { createdAt: -1 };
            break;
        case 'oldest':
            sort = { createdAt: 1 };
            break;
        case 'highest':
            sort = { rating: -1, createdAt: -1 };
            break;
        case 'lowest':
            sort = { rating: 1, createdAt: -1 };
            break;
    }
    const baseQuery = { book: bookId, status: 'Approved' };
    const [reviews, total] = await Promise.all([
        Review_1.default.find(baseQuery)
            .populate('user', 'fullName avatar')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Review_1.default.countDocuments(baseQuery)
    ]);
    return {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}
/**
 * Lấy danh sách reviews của user
 */
async function getUserReviews(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
        Review_1.default.find({ user: userId })
            .populate('book', 'title coverImage authorId category')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Review_1.default.countDocuments({ user: userId })
    ]);
    return {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}
async function getReviewsForAdmin({ status, bookId, userId, ratingFrom, ratingTo, search, page = 1, limit = 10 }) {
    const query = {};
    if (status) {
        query.status = status;
    }
    if (bookId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(bookId)) {
            throw new Error('ID sách không hợp lệ');
        }
        query.book = bookId;
    }
    if (userId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new Error('ID người dùng không hợp lệ');
        }
        query.user = userId;
    }
    if (typeof ratingFrom === 'number' || typeof ratingTo === 'number') {
        query.rating = {};
        if (typeof ratingFrom === 'number') {
            query.rating.$gte = ratingFrom;
        }
        if (typeof ratingTo === 'number') {
            query.rating.$lte = ratingTo;
        }
    }
    if (search) {
        query.comment = { $regex: search, $options: 'i' };
    }
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
        Review_1.default.find(query)
            .populate('user', 'fullName email')
            .populate('book', 'title coverImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Review_1.default.countDocuments(query)
    ]);
    return {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}
async function moderateReview(reviewId, adminId, action, note) {
    if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
        throw new Error('ID đánh giá không hợp lệ');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(adminId)) {
        throw new Error('ID quản trị viên không hợp lệ');
    }
    const review = await Review_1.default.findById(reviewId);
    if (!review) {
        throw new Error('Đánh giá không tồn tại');
    }
    const bookId = review.book.toString();
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const previousStatus = review.status;
    review.status = newStatus;
    review.moderatedBy = new mongoose_1.default.Types.ObjectId(adminId);
    review.moderatedAt = new Date();
    review.moderationNote = note?.trim() || undefined;
    await review.save();
    await review.populate([
        { path: 'user', select: 'fullName email' },
        { path: 'book', select: 'title coverImage' }
    ]);
    if (previousStatus !== newStatus || newStatus === 'Approved') {
        await updateBookRating(bookId);
    }
    return review;
}
//# sourceMappingURL=reviewService.js.map