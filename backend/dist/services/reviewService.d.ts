import { IReview, ReviewStatus } from '../models/Review';
/**
 * Kiểm tra user đã mượn và trả sách chưa
 */
export declare function canUserReviewBook(userId: string, bookId: string): Promise<{
    canReview: boolean;
    message?: string;
}>;
/**
 * Tạo review mới
 */
export declare function createReview(userId: string, bookId: string, rating: number, comment?: string): Promise<IReview>;
/**
 * Cập nhật review
 */
export declare function updateReview(reviewId: string, userId: string, rating?: number, comment?: string): Promise<IReview>;
/**
 * Xóa review
 */
export declare function deleteReview(reviewId: string, userId: string): Promise<void>;
/**
 * Cập nhật rating và reviewCount của sách dựa trên tất cả reviews
 */
export declare function updateBookRating(bookId: string): Promise<void>;
/**
 * Lấy danh sách reviews của một sách
 */
export declare function getBookReviews(bookId: string, page?: number, limit?: number, sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest'): Promise<{
    reviews: IReview[];
    total: number;
    page: number;
    totalPages: number;
}>;
/**
 * Lấy danh sách reviews của user
 */
export declare function getUserReviews(userId: string, page?: number, limit?: number): Promise<{
    reviews: IReview[];
    total: number;
    page: number;
    totalPages: number;
}>;
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
export declare function getReviewsForAdmin({ status, bookId, userId, ratingFrom, ratingTo, search, page, limit }: AdminReviewFilters): Promise<{
    reviews: IReview[];
    total: number;
    page: number;
    totalPages: number;
}>;
export declare function moderateReview(reviewId: string, adminId: string, action: 'approve' | 'reject', note?: string): Promise<IReview>;
export {};
//# sourceMappingURL=reviewService.d.ts.map