
// Fixed book.service.ts - Correct types for API structure

import { 
  getBooksWithFilters,
  getBooksByCategory,
  getRelatedBooks,
  // incrementBookView,
  getBookReviews,
  addBookReview,
  updateReviewHelpful,
  borrowBook,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  type BookFilters,
  type Review,
  type BorrowRequest,
  type PurchaseRequest,
  type Favorite,
  incrementBookView,
  getMyBorrows,
  renewBorrow,
  returnBook,
  reserveBook,
  type ReservationRequest,
  createRentalPaymentLink,
  getUserFavoritesWithBooks,
  cancelReservation,
  updateReservation,
  getReservationById,
  getAllMembershipPlans,
  getMembershipPlanById,
  subscribeMembership,
  cancelMembership,
  checkMembershipStatus,
  markNotificationAsRead,
  getFavoriteBookNotifications,
  deleteNotification,
  markAllNotificationsAsRead,
  getNotifications,
} from './book.api';

// import { getBookById } from './store.api';
import type { Book, Borrow, BorrowsData, FavoriteBook, MembershipPlan, NotificationItem, RatingStats, RentalPaymentRequest, RentalPaymentResponse, ReviewsResponse, UserMembership } from '../types';
import { getBookById } from './store.api';
import type { Reservation } from '../types';

// ==================== HELPER FUNCTIONS ====================

/**
 * Get author name from book
 */
const getAuthorName = (book: Book): string => {
  return book.authorId?.name || 'Không rõ tác giả';
};

/**
 * Get publisher name from book
 */
const getPublisherName = (book: Book): string => {
  return book.publisherId?.name || 'Không rõ nhà xuất bản';
};

/**
 * Check if book is available
 */
const isBookAvailable = (book: Book): boolean => {
  return book.status === 'available' && (book.availableCopies || book.available || 0) > 0;
};

/**
 * Format price to VND
 */
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// ==================== BOOK SERVICE ====================

class BookService {
  /**
   * Lấy danh sách sách với filter
   */
  async getBooks(filters?: BookFilters): Promise<Book[]> {
    try {
      if (filters && Object.keys(filters).length > 0) {
        return await getBooksWithFilters(filters);
      }
      
      // Nếu không có filter, lấy mặc định
      return await getBooksWithFilters({ page: 1, limit: 20 });
    } catch (error) {
      console.error('[BookService] getBooks error:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết sách và tăng view count
   */
  async getBookDetail(bookId: string): Promise<Book> {
    try {
      const book = await getBookById(bookId);
      
      // Tăng view count (background task - không chờ kết quả)
      incrementBookView(bookId).catch(err => 
        console.error('[BookService] Failed to increment view:', err)
      );
      
      return book;
    } catch (error) {
      console.error('[BookService] getBookDetail error:', error);
      throw error;
    }
  }

  /**
   * Lấy sách liên quan
   */
  async getRelatedBooks(bookId: string, limit: number = 4): Promise<Book[]> {
    try {
      return await getRelatedBooks(bookId, limit);
    } catch (error) {
      console.error('[BookService] getRelatedBooks error:', error);
      return [];
    }
  }

  /**
   * Lấy sách theo category
   */
  async getBooksByCategory(category: string, limit?: number): Promise<Book[]> {
    try {
      return await getBooksByCategory(category, limit);
    } catch (error) {
      console.error('[BookService] getBooksByCategory error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái sách
   */
  checkBookAvailability(book: Book): {
    isAvailable: boolean;
    availableQuantity: number;
    message: string;
    status: 'available' | 'low-stock' | 'out-of-stock';
  } {
    const quantity = book.availableCopies || book.available || 0;
    const available = isBookAvailable(book);
    
    let message = '';
    let status: 'available' | 'low-stock' | 'out-of-stock' = 'available';
    
    if (!available || quantity === 0) {
      message = 'Hết sách';
      status = 'out-of-stock';
    } else if (quantity <= 3) {
      message = `Chỉ còn ${quantity} cuốn`;
      status = 'low-stock';
    } else {
      message = `Còn ${quantity} cuốn`;
      status = 'available';
    }

    return { 
      isAvailable: available, 
      availableQuantity: quantity, 
      message,
      status 
    };
  }

  /**
   * Tính toán giá với discount
   */
  calculatePrice(book: Book, quantity: number): {
    basePrice: number;
    originalPrice: number;
    discount: number;
    discountAmount: number;
    finalPrice: number;
    savings: number;
    rentalPrice?: number;
  } {
    const basePrice = book.price || 0;
    const originalPrice = basePrice * quantity;
    
    // Sử dụng discount từ API (nếu có)
    let discount = book.discount || 0;
    
    // Logic discount theo số lượng (optional)
    let quantityDiscount = 0;
    if (quantity >= 10) {
      quantityDiscount = 20;
    } else if (quantity >= 5) {
      quantityDiscount = 15;
    } else if (quantity >= 3) {
      quantityDiscount = 10;
    }

    // Lấy discount cao nhất
    discount = Math.max(discount, quantityDiscount);

    const discountAmount = Math.round(originalPrice * (discount / 100));
    const finalPrice = originalPrice - discountAmount;
    const savings = discountAmount;

    return {
      basePrice,
      originalPrice,
      discount,
      discountAmount,
      finalPrice,
      savings,
      rentalPrice: book.rentalPrice ? book.rentalPrice * quantity : undefined
    };
  }

  /**
   * Format giá tiền VNĐ
   */
  formatPrice(price: number): string {
    return formatPrice(price);
  }

  /**
   * Validate số lượng mượn/mua
   */
  validateQuantity(
    quantity: number, 
    availableQuantity: number,
    maxAllowed: number = 5
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (quantity < 1) {
      errors.push('Số lượng phải lớn hơn 0');
    }

    if (!Number.isInteger(quantity)) {
      errors.push('Số lượng phải là số nguyên');
    }

    if (quantity > maxAllowed) {
      errors.push(`Số lượng tối đa là ${maxAllowed} cuốn`);
    }

    if (quantity > availableQuantity) {
      errors.push(`Chỉ còn ${availableQuantity} cuốn trong kho`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get author name from book
   */
  getAuthorName(book: Book): string {
    return getAuthorName(book);
  }

  /**
   * Get publisher name from book
   */
  getPublisherName(book: Book): string {
    return getPublisherName(book);
  }

  /**
   * Check if book is available
   */
  isBookAvailable(book: Book): boolean {
    return isBookAvailable(book);
  }

  /**
   * Check if book is new release
   */
  isNewRelease(book: Book): boolean {
    return book.isNewRelease || false;
  }

  /**
   * Check if book is premium
   */
  isPremium(book: Book): boolean {
    return book.isPremium || false;
  }

  /**
   * Get book category
   */
  getCategory(book: Book): string {
    return book.category || 'Chưa phân loại';
  }

  /**
   * Get book language
   */
  getLanguage(book: Book): string {
    return book.language || 'Không rõ';
  }

  /**
   * Format book info for display
   */
  formatBookInfo(book: Book): {
    title: string;
    author: string;
    publisher: string;
    category: string;
    pages: number;
    language: string;
    publicationYear: number;
    isbn: string;
    price: string;
    rentalPrice: string;
    discount: number;
    rating: number;
    reviewCount: number;
    availableCopies: number;
    isAvailable: boolean;
    isNewRelease: boolean;
    isPremium: boolean;
  } {
    return {
      title: book.title,
      author: this.getAuthorName(book),
      publisher: this.getPublisherName(book),
      category: this.getCategory(book),
      pages: book.pages || 0,
      language: this.getLanguage(book),
      publicationYear: book.publicationYear || 0,
      isbn: book.isbn || '',
      price: this.formatPrice(book.price || 0),
      rentalPrice: this.formatPrice(book.rentalPrice || 0),
      discount: book.discount || 0,
      rating: book.rating || 0,
      reviewCount: book.reviewCount || 0,
      availableCopies: book.availableCopies || 0,
      isAvailable: this.isBookAvailable(book),
      isNewRelease: this.isNewRelease(book),
      isPremium: this.isPremium(book),
    };
  }
}

class ReviewService {
  /**
   * ✅ UPDATED: Lấy reviews của sách với pagination
   * NEW: Sử dụng API mới GET /api/reviews/book/:bookId
   */
  async getReviews(
    bookId: string,
    page: number = 1,
    limit: number = 5,
    sortBy: 'newest' | 'oldest' | 'rating' = 'newest'
  ): Promise<ReviewsResponse> {
    try {
      return await getBookReviews(bookId, page, limit, sortBy);
    } catch (error) {
      console.error('[ReviewService] getReviews error:', error);
      
      // Return empty response on error
      return {
        reviews: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalReviews: 0,
          limit
        }
      };
    }
  }

  /**
   * ✅ UPDATED: Tính toán thống kê rating từ reviews list
   * Sử dụng khi đã có danh sách reviews
   */
  calculateRatingStats(reviews: Review[]): RatingStats {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

    const ratingDistribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = review.rating || 0;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    const ratingPercentages: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    Object.keys(ratingDistribution).forEach(rating => {
      const count = ratingDistribution[Number(rating)];
      ratingPercentages[Number(rating)] = Math.round((count / reviews.length) * 100);
    });

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
      ratingPercentages
    };
  }

  /**
   * ✅ DEPRECATED: Legacy method - không cần dùng nữa
   * Giữ lại để backward compatibility
   * @deprecated Use calculateRatingStats() instead
   */
  async getRatingStats(bookId: string): Promise<RatingStats> {
    try {
      console.warn('[ReviewService] getRatingStats() is deprecated. Use calculateRatingStats() instead.');
      
      // Fetch tất cả reviews (không phân trang)
      const response = await getBookReviews(bookId, 1, 1000);
      return this.calculateRatingStats(response.reviews);
    } catch (error) {
      console.error('[ReviewService] getRatingStats error:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
  }

  /**
   * ✅ UPDATED: Submit review mới
   * Simplified - backend handles user info from token
   */
  async submitReview(
    bookId: string,
    rating: number,
    comment: string
  ): Promise<Review> {
    try {
      // Validate first
      const validation = this.validateReview(rating, comment);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Call API with new signature
      const createdReview = await addBookReview(bookId, rating, comment);
      
      console.log('[ReviewService] Review submitted successfully:', createdReview);

      return createdReview;
    } catch (error) {
      console.error('[ReviewService] submitReview error:', error);
      throw error;
    }
  }

  /**
   * ✅ REMOVED: refreshBookRating method
   * Backend tự động cập nhật rating khi có review mới
   */

  /**
   * Đánh dấu review hữu ích
   */
  async markReviewHelpful(reviewId: string, currentHelpful: number): Promise<Review> {
    try {
      return await updateReviewHelpful(reviewId, currentHelpful + 1);
    } catch (error) {
      console.error('[ReviewService] markReviewHelpful error:', error);
      throw error;
    }
  }

  /**
   * Validate review data
   */
  validateReview(rating: number, comment: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!rating || rating < 1 || rating > 5) {
      errors.push('Vui lòng chọn đánh giá từ 1 đến 5 sao');
    }

    if (!comment || comment.trim().length === 0) {
      errors.push('Vui lòng nhập nội dung đánh giá');
    } else if (comment.trim().length < 10) {
      errors.push('Nội dung đánh giá phải có ít nhất 10 ký tự');
    } else if (comment.trim().length > 1000) {
      errors.push('Nội dung đánh giá không được quá 1000 ký tự');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get review summary text
   */
  getReviewSummary(totalReviews: number, averageRating: number): string {
    if (totalReviews === 0) {
      return 'Chưa có đánh giá';
    }

    const ratingText = averageRating >= 4.5 ? 'Xuất sắc' :
                       averageRating >= 4.0 ? 'Rất tốt' :
                       averageRating >= 3.0 ? 'Tốt' :
                       averageRating >= 2.0 ? 'Trung bình' : 'Kém';

    return `${ratingText} - ${totalReviews} đánh giá`;
  }

  /**
   * Format rating for display
   */
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  /**
   * Get rating stars (for UI)
   */
  getRatingStars(rating: number): {
    fullStars: number;
    halfStar: boolean;
    emptyStars: number;
  } {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return {
      fullStars,
      halfStar: hasHalfStar,
      emptyStars
    };
  }

  /**
   * ✅ NEW: Get sort parameters for API
   */
  getSortParams(sortBy: 'newest' | 'oldest' | 'rating'): {
    sort: string;
    order: 'asc' | 'desc';
  } {
    const sortMap = {
      newest: { sort: 'date', order: 'desc' as const },
      oldest: { sort: 'date', order: 'asc' as const },
      rating: { sort: 'rating', order: 'desc' as const }
    };

    return sortMap[sortBy];
  }

  /**
   * ✅ NEW: Format review date for display
   */
  formatReviewDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hôm nay';
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} tuần trước`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} tháng trước`;
    } else {
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  /**
   * ✅ NEW: Check if user can review (based on borrow history)
   * TODO: Implement when borrow history API is available
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async canUserReview(bookId: string): Promise<{
    canReview: boolean;
    reason?: string;
  }> {
    try {
      // TODO: Check if user has borrowed this book
      // For now, return true (implement later with borrow history)
      return {
        canReview: true
      };
    } catch (error) {
      console.error('[ReviewService] canUserReview error:', error);
      return {
        canReview: false,
        reason: 'Không thể kiểm tra lịch sử mượn sách'
      };
    }
  }
}

// ==================== BORROW SERVICE ====================
// ==================== UPDATED BORROW SERVICE ====================

class BorrowService {
  
  // ==================== RENTAL METHODS ====================
  
  /**
   * Step 1: Tạo payment link cho mượn lẻ (Rental)
   * User chọn số ngày → Tạo link thanh toán
   */
  async createRentalPaymentLink(
    bookId: string,
    rentalDays: number
  ): Promise<RentalPaymentResponse> {
    try {
      // Ensure rentalDays is an integer
      const rentalDaysInt = Number.isInteger(rentalDays) ? rentalDays : Math.floor(Number(rentalDays));
      
      // Validate
      const validation = this.validateRentalRequest(bookId, rentalDaysInt);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const data: RentalPaymentRequest = {
        bookId,
        rentalDays: rentalDaysInt,
      };

      return await createRentalPaymentLink(data);
    } catch (error) {
      console.error('[BorrowService] createRentalPaymentLink error:', error);
      throw error;
    }
  }

  /**
   * Step 2: Mượn sách với Rental (sau khi thanh toán thành công)
   * User đã thanh toán → Hoàn tất mượn sách
   */
  async borrowWithRental(
    bookId: string,
    rentalDays: number,
    paymentId: string
  ): Promise<Borrow> {
    try {
      // Ensure rentalDays is an integer
      const rentalDaysInt = Number.isInteger(rentalDays) ? rentalDays : Math.floor(Number(rentalDays));
      
      // Validate
      const validation = this.validateRentalRequest(bookId, rentalDaysInt);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      if (!paymentId?.trim()) {
        throw new Error('PaymentId là bắt buộc');
      }

      const borrowData: BorrowRequest = {
        bookId,
        borrowType: 'Rental',
        rentalDays: rentalDaysInt,
        paymentId,
      };

      return await borrowBook(borrowData);
    } catch (error) {
      console.error('[BorrowService] borrowWithRental error:', error);
      throw error;
    }
  }

  // ==================== MEMBERSHIP METHODS ====================

  /**
   * Mượn sách theo Membership (không cần thanh toán)
   * User có membership active → Mượn trực tiếp
   */
  async borrowWithMembership(bookId: string): Promise<Borrow> {
    try {
      console.log('📤 BorrowService - borrowWithMembership called with:', { bookId });
      if (!bookId?.trim()) {
        throw new Error('Book ID không hợp lệ');
      }

      const borrowData: BorrowRequest = {
        bookId,
        borrowType: 'Membership',
      };
console.log('📤 Sending borrow request:', borrowData);
      return await borrowBook(borrowData);
    } catch (error) {
      console.error('[BorrowService] borrowWithMembership error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Submit rental borrow request to librarian (No payment required)
   * Rental borrows now require librarian approval instead of auto-approval
   */
  async submitRentalBorrowRequest(
    bookId: string,
    rentalDays: number
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      borrow: Borrow;
    };
  }> {
    try {
      console.log('📤 [submitRentalBorrowRequest] Starting with:', { bookId, rentalDays });

      // Validate input
      if (!bookId?.trim()) {
        throw new Error('Book ID không hợp lệ');
      }

      if (!rentalDays || rentalDays < 1 || rentalDays > 7) {
        throw new Error('Số ngày thuê phải từ 1-7 ngày');
      }

      // Create borrow request with borrowType: "Rental"
      const borrowData: BorrowRequest = {
        bookId,
        borrowType: 'Rental',
        rentalDays,
      };

      console.log('📤 [submitRentalBorrowRequest] Sending request:', borrowData);

      // Call borrowBook API which will create a Pending borrow record
      const borrow = await borrowBook(borrowData);

      console.log('✅ [submitRentalBorrowRequest] Success:', borrow);

      return {
        success: true,
        message: 'Đã gửi yêu cầu mượn sách đến thủ thư',
        data: {
          borrow,
        },
      };
    } catch (error) {
      console.error('❌ [submitRentalBorrowRequest] Error:', error);
      throw error;
    }
  }

  // ==================== VALIDATION METHODS ====================
  
  /**
   * Validate rental request
   */
  validateRentalRequest(
    bookId: string,
    rentalDays: number
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!bookId?.trim()) {
      errors.push('Book ID không hợp lệ');
    }

    if (!rentalDays || !Number.isInteger(rentalDays)) {
      errors.push('Số ngày thuê phải là số nguyên');
    }

    if (rentalDays < 1 || rentalDays > 7) {
      errors.push('Số ngày thuê phải từ 1-7 ngày');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==================== CALCULATION METHODS ====================
  
  /**
   * Calculate rental price
   */
  calculateRentalPrice(rentalPricePerDay: number, rentalDays: number): number {
    return rentalPricePerDay * rentalDays;
  }

  /**
   * Format rental info for display
   */
  formatRentalInfo(
    rentalPricePerDay: number,
    rentalDays: number
  ): {
    pricePerDay: string;
    totalPrice: number;
    totalPriceFormatted: string;
    days: number;
  } {
    const totalPrice = this.calculateRentalPrice(rentalPricePerDay, rentalDays);

    return {
      pricePerDay: this.formatPrice(rentalPricePerDay),
      totalPrice,
      totalPriceFormatted: this.formatPrice(totalPrice),
      days: rentalDays,
    };
  }

  // ==================== UTILITY METHODS ====================
  
  /**
   * Get borrow type display text
   */
  getBorrowTypeText(borrowType: 'Membership' | 'Rental'): string {
    return borrowType === 'Membership' ? 'Mượn theo gói' : 'Mượn lẻ';
  }

  /**
   * Get borrow type badge color
   */
  getBorrowTypeBadgeClass(borrowType: 'Membership' | 'Rental'): string {
    return borrowType === 'Membership' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  }

  /**
   * Check if can renew based on borrow type
   * Rental không được gia hạn (maxRenewals = 0)
   * Membership có thể gia hạn (tùy theo maxRenewals)
   */
  canRenewByType(borrow: Borrow): boolean {
    // Rental không được gia hạn 
    if (borrow.borrowType === 'Rental') {
      return false;
    }
    
    // Membership có thể gia hạn nếu chưa quá maxRenewals
    return borrow.status === 'Borrowed' && 
           borrow.renewalCount < borrow.maxRenewals;
  }

  /**
   * Get renew button text
   */
  getRenewButtonText(borrow: Borrow): string {
    if (borrow.borrowType === 'Rental') {
      return 'Không thể gia hạn (Mượn lẻ)';
    }
    
    if (borrow.renewalCount >= borrow.maxRenewals) {
      return `Đã gia hạn ${borrow.renewalCount}/${borrow.maxRenewals} lần`;
    }
    
    return `Gia hạn (${borrow.renewalCount}/${borrow.maxRenewals})`;
  }

  // ==================== EXISTING METHODS ====================
  
 /**
   * Lấy danh sách sách đã và đang mượn của user hiện tại
   */
  async getMyBorrows(page: number = 1, limit: number = 10): Promise<BorrowsData> {
    try {
      console.log('🚀 [BorrowService] getMyBorrows called:', { page, limit });
      
      const result = await getMyBorrows(page, limit);
      
      console.log('📊 [BorrowService] getMyBorrows result:', {
        borrowsCount: result.borrows.length,
        pagination: result.pagination,
      });
      
      // ✅ LOG DETAILED BORROW ANALYSIS
      const analysis = {
        total: result.borrows.length,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        withRentalDays: 0,
        withPaymentId: 0,
        withNotes: 0,
        withDamageFee: 0,
        withReturnDate: 0,
        overdue: 0,
        canRenew: 0,
      };
      
      result.borrows.forEach((borrow) => {
        // Count by status
        analysis.byStatus[borrow.status] = (analysis.byStatus[borrow.status] || 0) + 1;
        
        // Count by type
        analysis.byType[borrow.borrowType] = (analysis.byType[borrow.borrowType] || 0) + 1;
        
        // Count optional fields
        if (borrow.rentalDays) analysis.withRentalDays++;
        if (borrow.paymentId) analysis.withPaymentId++;
        if (borrow.notes) analysis.withNotes++;
        if (borrow.damageFee && borrow.damageFee > 0) analysis.withDamageFee++;
        if (borrow.returnDate) analysis.withReturnDate++;
        
        // Count overdue
        if (borrow.status === 'Borrowed' && this.isOverdue(borrow.dueDate)) {
          analysis.overdue++;
        }
        
        // Count can renew
        if (this.canRenewByType(borrow)) {
          analysis.canRenew++;
        }
      });
      
      console.log('📈 [BorrowService] Borrows Analysis:', analysis);
      
      // ✅ LOG SAMPLE BORROW (first one)
      if (result.borrows.length > 0) {
        const sample = result.borrows[0];
        console.log('🔬 [BorrowService] Sample Borrow (First Item):', {
          id: sample._id || sample.id,
          status: sample.status,
          borrowType: sample.borrowType,
          borrowDate: sample.borrowDate,
          dueDate: sample.dueDate,
          returnDate: sample.returnDate,
          renewalCount: sample.renewalCount,
          maxRenewals: sample.maxRenewals,
          rentalDays: sample.rentalDays,
          paymentId: sample.paymentId,
          notes: sample.notes,
          damageFee: sample.damageFee,
          book: {
            id: sample.book._id || sample.book.id,
            title: sample.book.title,
            isbn: sample.book.isbn,
            category: sample.book.category,
            image: sample.book.image || sample.book.coverImage,
          },
          borrowStatus: this.getBorrowStatus(sample.dueDate),
          canRenew: this.canRenewByType(sample),
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ [BorrowService] getMyBorrows error:', error);
      throw error;
    }
  }

  /**
   * Gia hạn mượn sách (chỉ cho Membership)
   */
  async renewBorrow(borrowId: string): Promise<Borrow> {
    try {
      return await renewBorrow(borrowId);
    } catch (error) {
      console.error('[BorrowService] renewBorrow error:', error);
      throw error;
    }
  }

  /**
   * Trả sách (cả Membership và Rental)
   */
  async returnBorrow(borrowId: string): Promise<unknown> {
    try {
      return await returnBook(borrowId);
    } catch (error) {
      console.error('[BorrowService] returnBorrow error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra có thể trả sách không (cả 2 loại đều được trả)
   */
  canReturn(borrow: Borrow): boolean {
    return borrow.status === 'Borrowed';
  }

  /**
   * Tính ngày trả sách
   */
  calculateDueDate(borrowDate: Date, daysToAdd: number = 14): Date {
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate;
  }

  /**
   * Format ngày tháng
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Tính số ngày còn lại
   */
// Trong book.service.ts - GIỮ NGUYÊN như hiện tại
calculateDaysRemaining(dueDate: Date | string | undefined): number {
  // Handle undefined or null dueDate
  if (!dueDate) {
    return 0; // Return 0 for pending borrows without dueDate
  }

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;

  // Check if date is valid
  if (isNaN(due.getTime())) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset về đầu ngày
  due.setHours(0, 0, 0, 0); // Reset về đầu ngày

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

  /**
   * Check if overdue
   */
  isOverdue(dueDate: Date | string | undefined): boolean {
    if (!dueDate) return false;
    return this.calculateDaysRemaining(dueDate) < 0;
  }

  /**
   * Calculate late fee
   */
  calculateLateFee(daysOverdue: number, feePerDay: number = 5000): number {
    if (daysOverdue <= 0) return 0;
    return daysOverdue * feePerDay;
  }

  /**
   * Get borrow status
   */
  getBorrowStatus(dueDate: Date | string | undefined): {
    status: 'on-time' | 'due-soon' | 'overdue' | 'pending';
    message: string;
    daysRemaining: number;
  } {
    // Nếu không có dueDate, trả về pending 
    if (!dueDate) {
      return {
        status: 'pending',
        message: 'Đang chờ duyệt',
        daysRemaining: 0
      };
    }
    
    const daysRemaining = this.calculateDaysRemaining(dueDate);
    
    let status: 'on-time' | 'due-soon' | 'overdue';
    let message: string;

    if (daysRemaining < 0) {
      status = 'overdue';
      message = `Quá hạn ${Math.abs(daysRemaining)} ngày`;
    } else if (daysRemaining <= 3) {
      status = 'due-soon';
      message = `Còn ${daysRemaining} ngày`;
    } else {
      status = 'on-time';
      message = `Còn ${daysRemaining} ngày`;
    }

    return { status, message, daysRemaining };
  }

  /**
   * Format price to VND
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}
// ==================== FAVORITE SERVICE - FIXED VERSION ====================
// Đây là phần code thay thế cho class FavoriteService trong book.service.ts

class FavoriteService {
  /**
   * Thêm vào yêu thích
   * Chỉ cần bookId (userId tự động lấy từ token ở backend)
   */
  async addToFavorites(bookId: string): Promise<FavoriteBook> {
    try {
      const response = await addToFavorites(bookId);
      
      // Response structure: { success: true, message: "...", data: { favoriteBook: {...} } }
      if (response.success && response.data?.favoriteBook) {
        return response.data.favoriteBook;
      }
      
      throw new Error('Failed to add to favorites');
    } catch (error) {
      console.error('[FavoriteService] addToFavorites error:', error);
      throw error;
    }
  }

  /**
   * Xóa khỏi yêu thích
   * Backend API: DELETE /favorite-books/:bookId
   */
  async removeFromFavorites(bookId: string): Promise<void> {
    try {
      await removeFromFavorites(bookId);
    } catch (error) {
      console.error('[FavoriteService] removeFromFavorites error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra đã yêu thích chưa
   * Backend API: GET /favorite-books/check/:bookId
   */
  async isFavorite(bookId: string): Promise<boolean> {
    try {
      const response = await checkFavorite(bookId);
      
      // Response structure: { success: true, data: { isFavorite: true/false, favoriteId?: "..." } }
      return response.data?.isFavorite || false;
    } catch (error) {
      console.error('[FavoriteService] isFavorite error:', error);
      return false;
    }
  }

  /**
   * Get favorite ID (nếu cần xóa sau này)
   */
  async getFavoriteId(bookId: string): Promise<string | null> {
    try {
      const response = await checkFavorite(bookId);
      return response.data?.favoriteId || null;
    } catch (error) {
      console.error('[FavoriteService] getFavoriteId error:', error);
      return null;
    }
  }

  /**
   * Toggle favorite status
   * Tự động thêm/xóa dựa trên trạng thái hiện tại
   */
  async toggleFavorite(
    bookId: string
  ): Promise<{ isFavorite: boolean; message: string }> {
    try {
      // Check current status
      const checkResponse = await checkFavorite(bookId);
      const isFavorite = checkResponse.data?.isFavorite || false;

      if (isFavorite) {
        // Remove from favorites
        await this.removeFromFavorites(bookId);
        return {
          isFavorite: false,
          message: 'Đã xóa khỏi danh sách yêu thích',
        };
      } else {
        // Add to favorites
        await this.addToFavorites(bookId);
        return {
          isFavorite: true,
          message: 'Đã thêm vào danh sách yêu thích',
        };
      }
    } catch (error) {
      console.error('[FavoriteService] toggleFavorite error:', error);
      throw error;
    }
  }
   /**
   * ⭐ NEW: Lấy danh sách sách yêu thích của user
   */
  async getFavoriteBooks(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    favoriteBooks: FavoriteBook[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      return await getUserFavoritesWithBooks(page, limit);
    } catch (error) {
      console.error('[FavoriteService] getFavoriteBooks error:', error);
      throw error;
    }
  }
}

// ==================== REVERSE SERVICE ====================
// Thêm class ReservationService
class ReservationService {
  /**
   * Tạo yêu cầu đặt trước sách
   */
  async createReservation(bookId: string): Promise<Reservation> {
    try {
      const reservationData: ReservationRequest = {
        bookId
      };

      return await reserveBook(reservationData);
    } catch (error) {
      console.error('[ReservationService] createReservation error:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một reservation
   */
  async getReservationById(reservationId: string): Promise<Reservation> {
    try {
      return await getReservationById(reservationId);
    } catch (error) {
      console.error('[ReservationService] getReservationById error:', error);
      throw error;
    }
  }

  /**
   * Hủy đặt trước
   */
  async cancelReservation(reservationId: string): Promise<void> {
    try {
      await cancelReservation(reservationId);
    } catch (error) {
      console.error('[ReservationService] cancelReservation error:', error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái reservation (cho admin)
   */
  async updateReservationStatus(
    reservationId: string,
    status: Reservation['status']
  ): Promise<Reservation> {
    try {
      return await updateReservation(reservationId, { status });
    } catch (error) {
      console.error('[ReservationService] updateReservationStatus error:', error);
      throw error;
    }
  }

  /**
   * Validate reservation
   */
  validateReservation(bookId: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!bookId || bookId.trim().length === 0) {
      errors.push('Book ID không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Kiểm tra reservation có thể hủy không
   */
  canCancelReservation(reservation: Reservation): boolean {
    return reservation.status === 'Pending' || reservation.status === 'Ready';
  }

  /**
   * Kiểm tra reservation đã hết hạn chưa
   */
  isExpired(reservation: Reservation): boolean {
    const now = new Date();
    const expiresAt = new Date(reservation.expiresAt);
    return now > expiresAt;
  }

  /**
   * Tính thời gian còn lại (giờ)
   */
  getTimeRemaining(expiresAt: string | Date): {
    hours: number;
    minutes: number;
    isExpired: boolean;
    formatted: string;
  } {
    const now = new Date();
    const expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    
    const diffMs = expires.getTime() - now.getTime();
    const isExpired = diffMs <= 0;
    
    if (isExpired) {
      return {
        hours: 0,
        minutes: 0,
        isExpired: true,
        formatted: 'Đã hết hạn'
      };
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hours,
      minutes,
      isExpired: false,
      formatted: `Còn ${hours}h ${minutes}m`
    };
  }

  /**
   * Get status color class
   */
  getStatusColorClass(status: Reservation['status']): string {
    const colorMap: Record<Reservation['status'], string> = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Ready: 'bg-green-100 text-green-800',
      Assigned: 'bg-blue-100 text-blue-800',
      Completed: 'bg-blue-100 text-blue-800',
      Fulfilled: 'bg-green-100 text-green-800',
      Cancelled: 'bg-gray-100 text-gray-800',
      Expired: 'bg-red-100 text-red-800',
      Rejected: 'bg-red-100 text-red-800'
    };

    return colorMap[status] || colorMap.Pending;
  }

  /**
   * Get status display text
   */
  getStatusText(status: Reservation['status']): string {
    const textMap: Record<Reservation['status'], string> = {
      Pending: 'Đang chờ',
      Ready: 'Sẵn sàng',
      Assigned: 'Đã gán - Chờ lấy sách',
      Completed: 'Hoàn tất',
      Fulfilled: 'Hoàn thành',
      Cancelled: 'Đã hủy',
      Expired: 'Hết hạn',
      Rejected: 'Bị từ chối'
    };

    return textMap[status] || 'Không xác định';
  }
}



// ==================== MEMBERSHIP SERVICE ====================

class MembershipService {
  // ==================== PLAN METHODS ====================

  /**
   * Lấy tất cả gói thành viên (Public)
   */
  async getAllPlans(): Promise<MembershipPlan[]> {
    try {
      const plans = await getAllMembershipPlans();
      return plans.sort((a, b) => a.price - b.price);
    } catch (error) {
      console.error('[MembershipService] getAllPlans error:', error);
      return [];
    }
  }

  /**
   * Lấy chi tiết gói thành viên (Public)
   */
  async getPlanById(planId: string): Promise<MembershipPlan> {
    try {
      return await getMembershipPlanById(planId);
    } catch (error) {
      console.error('[MembershipService] getPlanById error:', error);
      throw error;
    }
  }

  // ==================== USER MEMBERSHIP METHODS ====================

  /**
   * Lấy membership hiện tại của user
   */
  async getMyMembership(): Promise<UserMembership | null> {
    try {
      return await this.getMyMembership();
    } catch (error) {
      console.error('[MembershipService] getMyMembership error:', error);
      return null;
    }
  }

  /**
   * Đăng ký gói thành viên
   */
  async subscribe(planId: string): Promise<{
    paymentLink: string;
    paymentId: string;
    amount: number;
  }> {
    try {
      return await subscribeMembership(planId);
    } catch (error) {
      console.error('[MembershipService] subscribe error:', error);
      throw error;
    }
  }

  /**
   * Hủy gói thành viên
   */
  async cancelMembership(): Promise<void> {
    try {
      await cancelMembership();
    } catch (error) {
      console.error('[MembershipService] cancelMembership error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái membership
   */
  async checkStatus(): Promise<{
    hasMembership: boolean;
    membership?: UserMembership;
    canBorrow: boolean;
    borrowsRemaining: number;
  }> {
    try {
      return await checkMembershipStatus();
    } catch (error) {
      console.error('[MembershipService] checkStatus error:', error);
      return {
        hasMembership: false,
        canBorrow: false,
        borrowsRemaining: 0,
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Format giá tiền
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  /**
   * Tính giá theo ngày
   */
  calculatePricePerDay(price: number, duration: number): number {
    return Math.round(price / duration);
  }

  /**
   * Format thời hạn
   */
formatDuration(days: number): string {
  // ⚠️ CRITICAL: Kiểm tra xem BE trả duration như thế nào
  // Nếu duration = 1 = 1 tháng → Nhân 30
  const actualDays = days * 30; // ← Thêm dòng này nếu BE đếm theo tháng
  
  if (actualDays >= 365) {
    const years = Math.floor(actualDays / 365);
    return `${years} năm`;
  } else if (actualDays >= 30) {
    const months = Math.floor(actualDays / 30);
    return `${months} tháng`;
  }
  return `${actualDays} ngày`;
}

  /**
   * Tính số ngày còn lại của membership
   */
  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Kiểm tra membership đã hết hạn chưa
   */
  isExpired(endDate: string): boolean {
    return this.getDaysRemaining(endDate) <= 0;
  }

  /**
   * Kiểm tra membership sắp hết hạn (trong 7 ngày)
   */
  isExpiringSoon(endDate: string): boolean {
    const days = this.getDaysRemaining(endDate);
    return days > 0 && days <= 7;
  }

  /**
   * Get plan tier color
   */
  getPlanColor(planName: string): {
    bg: string;
    badge: string;
    button: string;
    text: string;
  } {
    const name = planName.toLowerCase();
    
    if (name.includes('premium') || name.includes('vip')) {
      return {
        bg: 'from-amber-500 to-orange-600',
        badge: 'bg-amber-100 text-amber-800',
        button: 'bg-amber-600 hover:bg-amber-700',
        text: 'text-amber-600',
      };
    } else if (name.includes('pro') || name.includes('plus')) {
      return {
        bg: 'from-purple-500 to-indigo-600',
        badge: 'bg-purple-100 text-purple-800',
        button: 'bg-purple-600 hover:bg-purple-700',
        text: 'text-purple-600',
      };
    }
    
    return {
      bg: 'from-blue-500 to-cyan-600',
      badge: 'bg-blue-100 text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-600',
    };
  }

  /**
   * Get membership status color
   */
  getStatusColor(status: UserMembership['status']): string {
    const colorMap: Record<UserMembership['status'], string> = {
      Active: 'bg-green-100 text-green-800',
      Expired: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800',
      Pending: 'bg-yellow-100 text-yellow-800',
    };
    return colorMap[status] || colorMap.Pending;
  }

  /**
   * Get membership status text
   */
  getStatusText(status: UserMembership['status']): string {
    const textMap: Record<UserMembership['status'], string> = {
      Active: 'Đang hoạt động',
      Expired: 'Đã hết hạn',
      Cancelled: 'Đã hủy',
      Pending: 'Chờ thanh toán',
    };
    return textMap[status] || 'Không xác định';
  }

  /**
   * Format ngày tháng
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Get plan icon name based on tier
   */
  getPlanIconName(planName: string): 'crown' | 'zap' | 'shield' {
    const name = planName.toLowerCase();
    if (name.includes('premium') || name.includes('vip')) {
      return 'crown';
    } else if (name.includes('pro') || name.includes('plus')) {
      return 'zap';
    }
    return 'shield';
  }
}


// ==================== NOTIFICATION SERVICE ====================

class NotificationService {
  /**
   * ✅ NEW: Lấy tất cả notifications (unified)
   */
  async getNotifications(
    status: 'unread' | 'read' | 'all' = 'unread',
    page: number = 1,
    limit: number = 10
  ) {
    try {
      return await getNotifications(status, page, limit);
    } catch (error) {
      console.error('[NotificationService] getNotifications error:', error);
      return {
        notifications: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * ✅ UPDATED: Lấy thông báo sách yêu thích đã available
   * Giờ sử dụng endpoint /notifications
   */
  async getFavoriteBookNotifications(): Promise<NotificationItem[]> {
    try {
      return await getFavoriteBookNotifications();
    } catch (error) { 
      console.error('[NotificationService] getFavoriteBookNotifications error:', error);
      return [];
    }
  }

  /**
   * ✅ UPDATED: Đánh dấu đã đọc thông báo
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('[NotificationService] markAsRead error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(): Promise<void> {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('[NotificationService] markAllAsRead error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Xóa notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('[NotificationService] deleteNotification error:', error);
      throw error;
    }
  }

  /**
   * ✅ UPDATED: Format thông báo cho UI
   */
  formatNotification(notification: NotificationItem): {
    id: string;
    title: string;
    message: string;
    bookId?: string;
    timeAgo: string;
    type: NotificationItem['type'];
    status: NotificationItem['status'];
  } {
    const timeAgo = this.getTimeAgo(notification.createdAt);
    
    return {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      bookId: notification.bookId,
      timeAgo,
      type: notification.type,
      status: notification.status,
    };
  }

  /**
   * Tính thời gian từ lúc tạo notification
   */
  private getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
}




// ==================== EXPORT SERVICES ====================
 
export const bookService = new BookService();
export const reviewService = new ReviewService();
export const borrowService = new BorrowService();
export const favoriteService = new FavoriteService();
export const reservationService = new ReservationService();
export const membershipService = new MembershipService();
export const notificationService = new NotificationService();


// Export types
export type { 
  BookFilters, 
  Review, 
  BorrowRequest, 
  PurchaseRequest,
  Favorite,
  Reservation,
  ReservationRequest,
    MembershipPlan,     
  UserMembership   
};