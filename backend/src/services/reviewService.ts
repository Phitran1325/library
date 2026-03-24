import mongoose from 'mongoose';
import Review, { IReview, ReviewStatus } from '../models/Review';
import Book from '../models/Book';
import Borrow from '../models/Borrow';

/**
 * Kiểm tra user đã mượn và trả sách chưa
 */
export async function canUserReviewBook(
  userId: string,
  bookId: string
): Promise<{ canReview: boolean; message?: string }> {
  // Kiểm tra xem user đã có ít nhất 1 lần mượn và trả sách này chưa
  const returnedBorrow = await Borrow.findOne({
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
  const existingReview = await Review.findOne({
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
export async function createReview(
  userId: string,
  bookId: string,
  rating: number,
  comment?: string
): Promise<IReview> {
  // Kiểm tra quyền đánh giá
  const permissionCheck = await canUserReviewBook(userId, bookId);
  if (!permissionCheck.canReview) {
    throw new Error(permissionCheck.message);
  }

  // Kiểm tra sách tồn tại
  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error('Sách không tồn tại');
  }

  // Tạo review
  const review = new Review({
    user: userId,
    book: bookId,
    rating,
    comment: comment?.trim(),
    status: 'Approved'
  });

  await review.save();

  // Cập nhật rating và reviewCount của sách
  await updateBookRating(bookId);

  return review;
}

/**
 * Cập nhật review
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  rating?: number,
  comment?: string
): Promise<IReview> {
  const review = await Review.findById(reviewId);
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

  // Review được tự động duyệt, không cần chờ duyệt lại
  review.status = 'Approved';
  review.moderatedBy = undefined;
  review.moderatedAt = undefined;
  review.moderationNote = undefined;

  await review.save();

  // Cập nhật lại rating của sách
  await updateBookRating(review.book.toString());

  return review;
}

/**
 * Xóa review
 */
export async function deleteReview(
  reviewId: string,
  userId: string
): Promise<void> {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new Error('Đánh giá không tồn tại');
  }

  // Kiểm tra quyền sở hữu
  if (review.user.toString() !== userId) {
    throw new Error('Bạn không có quyền xóa đánh giá này');
  }

  const bookId = review.book.toString();
  const wasApproved = review.status === 'Approved';
  await Review.findByIdAndDelete(reviewId);

  if (wasApproved) {
    await updateBookRating(bookId);
  }
}

/**
 * Cập nhật rating và reviewCount của sách dựa trên tất cả reviews
 */
export async function updateBookRating(bookId: string): Promise<void> {
  const reviews = await Review.find({ book: bookId, status: 'Approved' });
  
  if (reviews.length === 0) {
    // Nếu không có review nào, đặt rating = 0 và reviewCount = 0
    await Book.findByIdAndUpdate(bookId, {
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
  await Book.findByIdAndUpdate(bookId, {
    rating: roundedRating,
    reviewCount: reviews.length
  });
}

/**
 * Lấy danh sách reviews của một sách
 */
export async function getBookReviews(
  bookId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest'
): Promise<{ reviews: IReview[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit;

  // Xây dựng sort object
  let sort: any = {};
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

  const baseQuery = { book: bookId, status: 'Approved' as ReviewStatus };

  const [reviews, total] = await Promise.all([
    Review.find(baseQuery)
      .populate('user', 'fullName avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(baseQuery)
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
export async function getUserReviews(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: IReview[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ user: userId })
      .populate('book', 'title coverImage authorId category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ user: userId })
  ]);

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

interface AdminReviewFilters {
  status?: ReviewStatus;
  bookId?: string;
  userId?: string;
  ratingFrom?: number;
  ratingTo?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getReviewsForAdmin({
  status,
  bookId,
  userId,
  ratingFrom,
  ratingTo,
  search,
  page = 1,
  limit = 10
}: AdminReviewFilters): Promise<{ reviews: IReview[]; total: number; page: number; totalPages: number }> {
  const query: Record<string, any> = {};

  if (status) {
    query.status = status;
  }

  if (bookId) {
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      throw new Error('ID sách không hợp lệ');
    }
    query.book = bookId;
  }

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
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
    Review.find(query)
      .populate('user', 'fullName email')
      .populate('book', 'title coverImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(query)
  ]);

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function moderateReview(
  reviewId: string,
  adminId: string,
  action: 'approve' | 'reject',
  note?: string
): Promise<IReview> {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new Error('ID đánh giá không hợp lệ');
  }

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error('ID quản trị viên không hợp lệ');
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new Error('Đánh giá không tồn tại');
  }

  const bookId = review.book.toString();

  const newStatus: ReviewStatus = action === 'approve' ? 'Approved' : 'Rejected';
  const previousStatus = review.status;

  review.status = newStatus;
  review.moderatedBy = new mongoose.Types.ObjectId(adminId);
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

