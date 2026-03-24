

// Fixed book.api.ts - Correct API imports

import axios from 'axios';
import type { Book, ApiResponse, BooksData, Borrow, BorrowsData, Reservation, RemoveFavoriteResponse, AddFavoriteResponse, CheckFavoriteResponse, ReviewsResponse, UserMembership, MembershipPlan, MembershipPlanResponse, UserMembershipResponse, MembershipPlansResponse, NotificationItem } from "../types";

// Create axios instance for direct API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
 
// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      
      // Handle 401 Unauthorized
      if (status === 401) {
        console.error('[API] Unauthorized - Token expired or invalid');
        
        // Clear token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login (optional - có thể bỏ nếu không muốn auto redirect)
        // window.location.href = '/login';
        
        // Or dispatch logout event
        window.dispatchEvent(new Event('auth:logout'));
      }
      
      console.error('[API Response Error]:', status, error.response.data);
    } else if (error.request) {
      console.error('[API No Response]:', error.request);
    } else {
      console.error('[API Setup Error]:', error.message);
    }
    
    return Promise.reject(error);
  }
);
// ==================== TYPES & INTERFACES ====================




export interface BookFilters {
  category?: string;
  search?: string;
  title?: string;
  sortBy?: string;
  page?: number;
  limit?: number; 
  author?: string;
  publisher?: string;
  year?: number;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
}
 
export interface Review {
  id: string;
  bookId: string;
    user: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  userName: string;
  userId?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  userAvatar?: string;
  images?: string[];
}

export interface BorrowRequest {
  // Required
  bookId: string;
  borrowType: 'Membership' | 'Rental';
  
  // Rental-specific (required if borrowType = 'Rental')
  rentalDays?: number;      // 1-7 days
  paymentId?: string;       // Payment reference from PayOS
  
  // Optional (backend auto-generates/calculates)
  userId?: string;
  quantity?: number;
  borrowDate?: string;
  dueDate?: string;
}

export interface PurchaseRequest {
  bookId: string;
  userId: string;
  quantity: number;
  totalPrice: number;
  unitPrice?: number;
}

export interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  addedDate: string;
}


// Đặt trước Sách, sau này cập nhật theo ngày hệ thống
export interface ReservationRequest {
  bookId: string;
}

// Add these interfaces to the existing file

export interface RentalPaymentRequest {
  bookId: string;
  rentalDays: number; // 1-7 days
}

export interface RentalPaymentResponse {
  success: boolean;
  message?: string;
  data: {
    paymentLink: string;
    paymentId: string;
    providerRef?: string;
    amount: number;
    expiresAt: string;
  };
}


interface ReservationApiItem {
  _id: string;
  id?: string;
  user: string;
  book: Book & { _id: string };
  status: 'Pending' | 'Ready' | 'Completed' | 'Cancelled' | 'Expired';
  expiresAt: string;
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}



// ==================== BOOK APIs ====================

/**
 * Lấy danh sách sách với filter và pagination
 */
export const getBooksWithFilters = async (filters: BookFilters): Promise<Book[]> => {
  try {
    const params: Record<string, string | number> = {
      page: filters.page || 1,
      limit: filters.limit || 20,
    };

    if (filters.category && filters.category !== 'all') {
      params.category = filters.category;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.title) {
      params.title = filters.title;
    }

    if (filters.author) {
      params.author = filters.author;
    }

    if (filters.publisher) {
      params.publisher = filters.publisher;
    }

    if (filters.year) {
      params.year = filters.year;
    }

    if (filters.minRating) {
      params.minRating = filters.minRating;
    }

    if (filters.minPrice) {
      params.minPrice = filters.minPrice;
    }
    
    if (filters.maxPrice) {
      params.maxPrice = filters.maxPrice;
    }

    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
    }

    const res = await api.get<ApiResponse<BooksData>>("/books", { params });
    
    if (res.data.success && res.data.data) {
      return res.data.data.books || [];
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching filtered books:", error);
    throw new Error("Không thể tải danh sách sách!");
  }
};

/**
 * Lấy sách theo category
 */
export const getBooksByCategory = async (category: string, limit?: number): Promise<Book[]> => {
  try {
    const params: Record<string, string | number> = { category };
    if (limit) params.limit = limit;

    const res = await api.get<ApiResponse<BooksData>>("/books", { params });
    
    if (res.data.success && res.data.data) {
      return res.data.data.books || [];
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching books by category:", error);
    throw new Error("Không thể tải sách theo thể loại!");
  }
};

/**
 * Lấy sách liên quan (cùng category)
 */
export const getRelatedBooks = async (
  bookId: string,
  limit: number = 4
): Promise<Book[]> => {
  try {
    // Get current book info
    const currentBookRes = await api.get<ApiResponse<{ book: Book }>>(`/books/${bookId}`);
    
    if (!currentBookRes.data.success || !currentBookRes.data.data) {
      throw new Error('Book not found');
    }
    
    const currentBook = currentBookRes.data.data.book;
    
    // Get books with same category
    const res = await api.get<ApiResponse<BooksData>>("/books", {
      params: {
        category: currentBook.category || 'Văn học',
        limit: limit + 5,
      },
    });
    
    if (!res.data.success || !res.data.data) {
      return [];
    }
    
    // Filter out current book and limit results
    const currentBookIdStr = String(bookId);
    const relatedBooks = res.data.data.books
      .filter(book => {
        const bookIdStr = String(book.id || book._id);
        return bookIdStr !== currentBookIdStr;
      })
      .slice(0, limit);
    
    return relatedBooks;
  } catch (error) {
    console.error("Error fetching related books:", error);
    
    // Fallback to random books
    try {
      const res = await api.get<ApiResponse<BooksData>>("/books", {
        params: { limit },
      });
      
      if (res.data.success && res.data.data) {
        return res.data.data.books || [];
      }
    } catch (fallbackError) {
      console.error("Error fetching fallback books:", fallbackError);
    }
    
    return [];
  }
};

/**
 * Cập nhật thông tin sách
 */
export const updateBook = async (
  bookId: string,
  data: Partial<Book>
): Promise<Book> => {
  try {
    const res = await api.patch<ApiResponse<{ book: Book }>>(`/books/${bookId}`, data);
    
    if (res.data.success && res.data.data) {
      return res.data.data.book;
    }
    
    throw new Error('Update failed');
  } catch (error) {
    console.error("Error updating book:", error);
    throw new Error("Không thể cập nhật thông tin sách!");
  }
};

/**
 * Tăng view count của sách (Background task)
 */
export const incrementBookView = async (bookId: string): Promise<void> => {
  try {
    await api.post(`/books/${bookId}/view`, {});
  } catch (error) {
    console.error("Error incrementing book view:", error);
  }
};

/**
 * Tăng borrow count của sách (Background task)
 */
export const incrementBorrowCount = async (bookId: string): Promise<void> => {
  try {
    await api.post(`/books/${bookId}/borrow-count`, {});
  } catch (error) {
    console.error("Error incrementing borrow count:", error);
  }
};

// ==================== REVIEW APIs ====================
/**
 * Get book reviews with pagination and sorting
 * NEW ENDPOINT: GET /api/reviews/book/:bookId
 */
export const getBookReviews = async (
  bookId: string,
  page: number = 1,
  limit: number = 5,
  sortBy: 'newest' | 'oldest' | 'rating' = 'newest'
): Promise<ReviewsResponse> => {
  try {
    // Map sorting options
    const sortParams: Record<typeof sortBy, { sort: string; order: 'asc' | 'desc' }> = {
      newest: { sort: 'date', order: 'desc' },
      oldest: { sort: 'date', order: 'asc' },
      rating: { sort: 'rating', order: 'desc' }
    };

    const { sort, order } = sortParams[sortBy];

    const res = await api.get<ApiResponse<ReviewsResponse>>(
      `/reviews/book/${bookId}`,
      {
        params: { page, limit, sort, order }
      }
    );

    // Success + valid data
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    // Fallback empty response
    return {
      reviews: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalReviews: 0,
        limit
      }
    };
  } catch (error) {
    console.error('[ReviewService] getBookReviews error:', error);

    // Always return safe default
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
};

/**
 * ✅ UPDATED: Thêm review mới
 * POST /api/reviews (NOT /api/books/:bookId/reviews)
 * 
 * Body: { bookId, rating, comment }
 * Response: { success, message, data: { review: {...} } }
 */
export const addBookReview = async (
  bookId: string,
  rating: number,
  comment: string
): Promise<Review> => {
  try {
    // ✅ NEW: POST to /reviews endpoint
    const res = await api.post<{
      success: boolean;
      message: string;
      data: {
        review: {
          id: string;
          book: string;
          rating: number;
          comment: string;
          createdAt: string;
        };
      };
    }>('/reviews', {
      bookId,
      rating,
      comment,
    });
    
    if (res.data.success && res.data.data?.review) {
      const reviewData = res.data.data.review;
      
      // Map to Review type
      return {
        id: reviewData.id,
        bookId: reviewData.book,
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: new Date(reviewData.createdAt).toLocaleDateString('vi-VN'),
        user: {
          id: '',
          fullName: '',
        },
        createdAt: '',
        userName: '',
        userAvatar: '',
        helpful: 0,
      };
    }
    
    throw new Error(res.data.message || 'Review creation failed');
  } catch (error) {
    console.error("Error adding review:", error);
    
    // Handle axios error
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Không thể gửi đánh giá!';
      throw new Error(message);
    }
    
    throw new Error("Không thể gửi đánh giá!");
  }
};

/**
 * Cập nhật số lượng helpful của review
 */
export const updateReviewHelpful = async (
  reviewId: string,
  helpful: number
): Promise<Review> => {
  try {
    const res = await api.patch<ApiResponse<{ review: Review }>>(
      `/reviews/${reviewId}/helpful`,
      { helpful }
    );
    
    if (res.data.success && res.data.data) {
      return res.data.data.review;
    }
    
    throw new Error('Update failed');
  } catch (error) {
    console.error("Error updating review helpful:", error);
    throw new Error("Không thể cập nhật đánh giá!");
  }
};

/**
 * Xóa review
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    await api.delete(`/reviews/${reviewId}`);
  } catch (error) {
    console.error("Error deleting review:", error);
    throw new Error("Không thể xóa đánh giá!");
  }
};
/**
 * Đặt trước sách
 * POST /api/reservations
 */



// ================================ Reserve Api =====================================
export async function reserveBook(data: ReservationRequest): Promise<Reservation> {
  try {
    const response = await api.post('/reservations', data);
    
    // Log để debug
    console.log('Reserve response:', response.data);
    
    // Handle different response structures from backend
    // Case 1: { success: true, data: { reservation: {...} } }
    if (response.data.success && response.data.data?.reservation) {
      return response.data.data.reservation;
    }
    
    // Case 2: { reservation: {...} }
    if (response.data.reservation) {
      return response.data.reservation;
    }
    
    // Case 3: Direct reservation object { id: ..., bookId: ..., ... }
    if (response.data.id && response.data.bookId) {
      return response.data as Reservation;
    }
    
    // Case 4: { data: { id: ..., bookId: ..., ... } }
    if (response.data.data && response.data.data.id) {
      return response.data.data as Reservation;
    }
    
    throw new Error('Invalid response structure from server');
  } catch (error) {
    console.error('Reserve book API error:', error);
    throw error;
  }
}
/**
 * Lấy danh sách đặt trước của user hiện tại
 * Maps all fields from API response properly
 */
export const getMyReservations = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  reservations: Reservation[];
  pagination: { total: number; page: number; limit: number; pages: number };
}> => {
  try {
    const res = await api.get<{
      reservations: ReservationApiItem[];
      pagination?: { total: number; page: number; limit: number; pages: number };
    }>('/reservations/me', {
      params: { page, limit },
    });

    console.log('🔍 Raw API response:', res.data);

    // Check nếu có reservations trực tiếp (không có wrapper)
    if (res.data.reservations) {
      // ✅ Filter out reservations with null book FIRST
      const validReservations = res.data.reservations.filter((item: ReservationApiItem) => item.book !== null);
      console.log(`🔍 Filtered out ${res.data.reservations.length - validReservations.length} reservations with null book`);
      
      const mappedReservations = validReservations.map((item: ReservationApiItem): Reservation => {
        const reservation: Reservation = {
          _id: item._id,
          id: item.id || item._id,
          user: item.user,
          book: {
            ...item.book,
            id: item.book.id || item.book._id,
            _id: item.book._id,
          },
          status: item.status,
          expiresAt: item.expiresAt,
          queuePosition: item.queuePosition,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        
        console.log('✅ Mapped reservation:', {
          id: reservation._id,
          user: reservation.user,
          bookId: reservation.book._id,
          bookTitle: reservation.book.title,
          status: reservation.status,
          expiresAt: reservation.expiresAt,
          queuePosition: reservation.queuePosition
        });
        
        return reservation;
      });
      
      console.log('📦 Total mapped reservations:', mappedReservations.length);
      
      return {
        reservations: mappedReservations,
        pagination: res.data.pagination || {
          total: mappedReservations.length,
          page: page,
          limit: limit,
          pages: Math.ceil(mappedReservations.length / limit),
        },
      };
    }

    console.warn('⚠️ No reservations in response');
    return {
      reservations: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 0 },
    };
  } catch (error) {
    console.error('❌ Error fetching my reservations:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không thể tải danh sách đặt trước!';
    throw new Error(errorMessage);
  }
};
/**
 * Hủy đặt trước
 * DELETE /api/reservations/:reservationId/cancel
 */
export const cancelReservation = async (reservationId: string): Promise<void> => {
  try {
    const res = await api.delete<ApiResponse<unknown>>(`/reservations/${reservationId}/cancel`);
    
    console.log('✅ Cancel reservation response:', res.data);
    
    // Check if response indicates success
    if (res.status === 200 || res.status === 204) {
      return;
    }
    
    // If has success field, check it
    if (res.data && 'success' in res.data && !res.data.success) {
      throw new Error(res.data.message || 'Hủy đặt trước thất bại');
    }
    
    return;
  } catch (error) {
    console.error('❌ Error canceling reservation:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      // Extract error message from response
      const errorMessage = errorData?.error || errorData?.message || 'Không thể hủy đặt trước!';
      
      // Handle specific error cases
      if (status === 403 || status === 401) {
        throw new Error('Bạn không có quyền hủy đặt trước này!');
      }
      
      if (status === 404) {
        throw new Error('Không tìm thấy đơn đặt trước!');
      }
      
      if (status === 400) {
        throw new Error(errorMessage);
      }
      
      if (status === 500) {
        // For 500 errors, use the specific error message from backend
        throw new Error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Lấy chi tiết một reservation cụ thể
 * GET /api/reservations/:reservationId
 */
export const getReservationById = async (reservationId: string): Promise<Reservation> => {
  try {
    const res = await api.get<{
      success: boolean;
      data: { reservation: ReservationApiItem };
    }>(`/reservations/${reservationId}`);

    if (res.data.success && res.data.data?.reservation) {
      const item = res.data.data.reservation;
      
      return {
        _id: item._id,
        id: item.id || item._id,
        user: item.user,
        book: {
          ...item.book,
          id: item.book.id || item.book._id,
          _id: item.book._id,
        },
        status: item.status,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    }

    throw new Error('Reservation not found');
  } catch (error) {
    console.error('❌ Error fetching reservation by ID:', error);
    
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Không thể tải thông tin đặt trước!';
      throw new Error(message);
    }
    
    throw new Error('Không thể tải thông tin đặt trước!');
  }
};

/**
 * Cập nhật trạng thái reservation (Admin only)
 * PATCH /api/reservations/:reservationId
 */
export const updateReservation = async (
  reservationId: string,
  updateData: Partial<Pick<Reservation, 'status'>>
): Promise<Reservation> => {
  try {
    const res = await api.patch<{
      success: boolean;
      data: { reservation: ReservationApiItem };
    }>(`/reservations/${reservationId}`, updateData);

    if (res.data.success && res.data.data?.reservation) {
      const item = res.data.data.reservation;
      
      return {
        _id: item._id,
        id: item.id || item._id,
        user: item.user,
        book: {
          ...item.book,
          id: item.book.id || item.book._id,
          _id: item.book._id,
        },
        status: item.status,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    }

    throw new Error('Update reservation failed');
  } catch (error) {
    console.error('❌ Error updating reservation:', error);
    
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Không thể cập nhật đặt trước!';
      throw new Error(message);
    }
    
    throw new Error('Không thể cập nhật đặt trước!');
  }
};

// ==================== RENTAL PAYMENT API ====================

/**
 * Tạo payment link cho mượn lẻ (Rental)
 * POST /api/borrows/payment-link
 */
export const createRentalPaymentLink = async (
  data: RentalPaymentRequest
): Promise<RentalPaymentResponse> => {
  try {
    const res = await api.post<{
      success: boolean;
      message?: string;
      data?: {
        paymentLink?: string;
        paymentId?: string;
        amount?: number;
        expiresAt?: string;
      };
    }>('/borrows/payment-link', data);

    if (res.data.success && res.data.data) {
      const responseData = res.data.data;
      const paymentLink = responseData.paymentLink;
      const paymentId = responseData.paymentId;

      if (!paymentLink || !paymentId) {
        throw new Error('Thiếu thông tin payment từ máy chủ');
      }

      return {
        success: true,
        message: res.data.message,
        data: {
          paymentLink,
          paymentId,
          amount: responseData.amount || 0,
          expiresAt: responseData.expiresAt || ''
        }
      };
    }

    throw new Error(res.data.message || 'Create payment link failed');
  } catch (error) {
    console.error('Error creating rental payment link:', error);

    // Preserve axios error to access response data
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data;
      if (apiError) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const message = apiError.message || 'Không thể tạo link thanh toán';
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const errors = Array.isArray(apiError.errors) ? apiError.errors : undefined;
        // Throw axios error to preserve response structure
        throw error;
      }
    }

    const errorMessage = error instanceof Error
      ? error.message
      : 'Không thể tạo link thanh toán!';
    throw new Error(errorMessage);
  }
};

// ==================== BORROW APIs ====================

/**
 * Mượn sách - UNIFIED endpoint supports both Membership and Rental
 * POST /api/borrows
 * 
 * For Membership:
 *   Body: { bookId, borrowType: "Membership" }
 * 
 * For Rental:
 *   Body: { bookId, borrowType: "Rental", rentalDays: 3, paymentId: "xxx" }
 */
export const borrowBook = async (borrowData: BorrowRequest): Promise<Borrow> => {
  try {
    // Client-side validation
    if (borrowData.borrowType === 'Rental') {
      if (!borrowData.rentalDays || borrowData.rentalDays < 1 || borrowData.rentalDays > 7) {
        throw new Error('Số ngày thuê phải từ 1-7 ngày');
      }
      // ✅ UPDATED: paymentId is optional for Rental borrows
      // Rental borrows without paymentId will be created with status 'Pending' for librarian approval
    }

    const res = await api.post<{
      success: boolean;
      message: string;
      data: { borrow: Borrow };
    }>('/borrows', borrowData);
    
    if (res.data.success && res.data.data) {
      const borrow = res.data.data.borrow;

      // Increment borrow count (background task) - DISABLED: endpoint không tồn tại
      // if (borrow.book._id || borrow.book.id) {
      //   incrementBorrowCount(borrow.book._id || borrow.book.id!).catch(console.error);
      // }

      // Map to ensure id fields are set
      return {
        ...borrow,
        id: borrow.id || borrow._id,
        book: {
          ...borrow.book,
          id: borrow.book.id || borrow.book._id,
        },
      };
    }
    
    throw new Error('Borrow failed');
  } catch (error) {
    console.error('Error borrowing book:', error);
    
    // ✅ KEY FIX: Check if it's an axios error and throw it directly
    if (axios.isAxiosError(error)) {
      // Log the error response for debugging
      if (error.response?.data) {
        console.log('[API Response Error]:', error.response.status, error.response.data);
      }
      
      // ✅ CRITICAL: Throw the original axios error to preserve error.response.data
      throw error;
    }
    
    // For non-axios errors (like client-side validation), throw as-is
    throw error;
  }
};

/**
 * Lấy danh sách đang mượn của user
 */
export const getCurrentBorrows = async (userId: string): Promise<unknown[]> => {
  try {
    const res = await api.get<ApiResponse<{ borrows: unknown[] }>>("/borrows", {
      params: {
        userId,
        status: 'borrowed',
      },
    });
    
    if (res.data.success && res.data.data) {
      return res.data.data.borrows || [];
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching current borrows:", error);
    return [];
  }
};

/**
 * Lấy danh sách sách đã và đang mượn của user hiện tại
 */
export const getMyBorrows = async (page: number = 1, limit: number = 10): Promise<BorrowsData> => {
  try {
    console.log('📤 [API] getMyBorrows REQUEST:', { page, limit });
    
    const res = await api.get<ApiResponse<BorrowsData>>("/borrows/me", {
      params: {
        page,
        limit,
      },
    });
    
    // ✅ LOG RAW RESPONSE
    console.log('📦 [API] getMyBorrows RAW RESPONSE:', {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      data: res.data,
    });
    
    // ✅ LOG RESPONSE STRUCTURE
    console.log('🔍 [API] Response Structure Check:', {
      hasSuccess: 'success' in res.data,
      successValue: res.data.success,
      hasData: 'data' in res.data,
      dataType: typeof res.data.data,
      dataKeys: res.data.data ? Object.keys(res.data.data) : null,
    });
    
    if (res.data.success && res.data.data) {
      // ✅ LOG BORROWS DETAILS
      console.log('📚 [API] Borrows Data:', {
        totalBorrows: res.data.data.borrows.length,
        pagination: res.data.data.pagination,
      });
      
      // ✅ LOG EACH BORROW ITEM
      res.data.data.borrows.forEach((borrow, index) => {
        console.log(`📖 [API] Borrow #${index + 1}:`, {
          id: borrow._id || borrow.id,
          status: borrow.status,
          borrowType: borrow.borrowType,
          borrowDate: borrow.borrowDate,
          dueDate: borrow.dueDate,
          returnDate: borrow.returnDate,
          renewalCount: borrow.renewalCount,
          maxRenewals: borrow.maxRenewals,
          rentalDays: borrow.rentalDays,
          paymentId: borrow.paymentId,
          notes: borrow.notes,
          damageFee: borrow.damageFee,
          book: borrow.book ? {
            id: borrow.book._id || borrow.book.id,
            title: borrow.book.title,
            isbn: borrow.book.isbn,
            category: borrow.book.category,
            hasImage: !!(borrow.book.image || borrow.book.coverImage),
          } : null,
        });
      });
      
      // Map borrows và lọc bỏ những borrow có book null
      const mappedBorrows = res.data.data.borrows
        .filter((borrow: Borrow & { _id?: string }) => {
          // Kiểm tra xem book có tồn tại không
          if (!borrow.book) {
            console.warn('⚠️ [API] Borrow has null book reference:', {
              borrowId: borrow._id || borrow.id,
              user: borrow.user,
              status: borrow.status,
            });
            return false;
          }
          return true;
        })
        .map((borrow: Borrow & { _id?: string }) => {
          const mapped = {
            ...borrow,
            id: borrow.id || borrow._id,
            book: {
              ...borrow.book,
              id: borrow.book.id || borrow.book._id,
            },
          };
          
          console.log('✅ [API] Mapped borrow:', {
            originalId: borrow._id || borrow.id,
            mappedId: mapped.id,
            bookOriginalId: borrow.book._id || borrow.book.id,
            bookMappedId: mapped.book.id,
          });
          
          return mapped;
        });
      
      const result = {
        borrows: mappedBorrows,
        pagination: res.data.data.pagination,
      };
      
      console.log('✅ [API] getMyBorrows SUCCESS:', {
        totalMapped: result.borrows.length,
        pagination: result.pagination,
      });
      
      return result;
    }
    
    console.warn('⚠️ [API] getMyBorrows: No data in response');
    return {
      borrows: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
      },
    };
  } catch (error) {
    console.error('❌ [API] getMyBorrows ERROR:', error);
    
    // ✅ LOG ERROR DETAILS
    if (axios.isAxiosError(error)) {
      console.error('❌ [API] Axios Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
        },
      });
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || "Không thể tải danh sách sách mượn!";
    throw new Error(errorMessage);
  }
};
/**
 * Trả sách
 */
export const returnBook = async (borrowId: string): Promise<unknown> => {
  try {
    const res = await api.patch<ApiResponse<unknown>>(`/borrows/${borrowId}`, {
      status: 'returned',
      returnDate: new Date().toISOString(),
    });
    
    if (res.data.success) {
      return res.data.data;
    }
    
    throw new Error('Return failed');
  } catch (error) {
    console.error("Error returning book:", error);
    throw new Error("Không thể trả sách!");
  }
};

/**
 * Gia hạn mượn sách
 */
export const extendBorrow = async (borrowId: string, newDueDate: string): Promise<unknown> => {
  try {
    const res = await api.patch<ApiResponse<unknown>>(`/borrows/${borrowId}/extend`, {
      dueDate: newDueDate,
    });
    
    if (res.data.success) {
      return res.data.data;
    }
    
    throw new Error('Extend failed');
  } catch (error) {
    console.error("Error extending borrow:", error);
    throw new Error("Không thể gia hạn mượn sách!");
  }
};

/**
 * Gia hạn mượn sách (renew)
 * POST /borrows/:borrowId/renew
 */
export const renewBorrow = async (borrowId: string): Promise<Borrow> => {
  try {
    console.log('[API] Renewing borrow:', borrowId);
    
    const res = await api.post<ApiResponse<{ borrow: Borrow }>>(
      `/borrows/${borrowId}/renew`
    );
    
    if (res.data.success && res.data.data) {
      const borrow = res.data.data.borrow;

      // Map to ensure id fields are set
      return {
        ...borrow,
        id: borrow._id,
        book: borrow.book ? {
          ...borrow.book,
          id: borrow.book.id || borrow.book._id,
        } : borrow.book,
      };
    }
    
    throw new Error(res.data.message || 'Gia hạn thất bại');
  } catch (error) {
    console.error('[API] renewBorrow error:', error);
    
    // Preserve BE error messages
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Không thể gia hạn mượn sách!';
      throw new Error(message);
    }
    
    throw error;
  }
};



// ==================== HELPER: OLD borrowBook for backward compatibility ====================

/**
 * @deprecated Use borrowBook with borrowType instead
 * Legacy method for backward compatibility
 */
export const borrowBookLegacy = async (
  bookId: string,
  userId: string,
  quantity: number,
  borrowDays: number = 14
): Promise<Borrow> => {
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + borrowDays);

  return await borrowBook({
    bookId,
    borrowType: 'Membership',
    userId,
    quantity,
    borrowDate: borrowDate.toISOString(),
    dueDate: dueDate.toISOString()
  });
};


// ==================== FAVORITE APIs - FIXED VERSION ====================
// Đây là phần code thay thế cho section FAVORITE APIs trong book.api.ts

/**
 * Thêm sách vào danh sách yêu thích
 * Sử dụng axios instance 'api' đã được config sẵn với baseURL và interceptors
 */
export const addToFavorites = async (bookId: string): Promise<AddFavoriteResponse> => {
  try {
    const res = await api.post<AddFavoriteResponse>('/favorite-books', { bookId });
    return res.data;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Xóa sách khỏi danh sách yêu thích
 */
export const removeFromFavorites = async (bookId: string): Promise<RemoveFavoriteResponse> => {
  try {
    const res = await api.delete<RemoveFavoriteResponse>(`/favorite-books/${bookId}`);
    return res.data;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Kiểm tra sách đã được yêu thích chưa
 */
export const checkFavorite = async (bookId: string): Promise<CheckFavoriteResponse> => {
  try {
    const res = await api.get<CheckFavoriteResponse>(`/favorite-books/check/${bookId}`);
    return res.data;
  } catch (error) {
    console.error('Error checking favorite:', error);
    throw error;
  }
};

/**
 * Lấy danh sách sách yêu thích của user hiện tại (với pagination)
 * GET /api/favorite-books?page=1&limit=10
 */

export const getUserFavoritesWithBooks = async (
  page: number = 1,
  limit: number = 10
) => {
  try {
    const res = await api.get('/favorite-books', {
      params: { page, limit },
    });

    if (res.data.success && res.data.data) {
      return {
        favoriteBooks: res.data.data.favoriteBooks,
        pagination: res.data.data.pagination,
      };
    }

    return {
      favoriteBooks: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  } catch (error) {
    console.error('Error fetching favorite books:', error);
    throw error;
  }
};



// ==================== STATISTICS APIs ====================

/**
 * Lấy thống kê sách (Optional endpoint)
 */
export const getBookStatistics = async (bookId: string): Promise<{
  viewCount: number;
  borrowCount: number;
  purchaseCount: number;
  favoriteCount: number;
}> => {
  try {
    const res = await api.get<ApiResponse<{
      statistics: {
        viewCount: number;
        borrowCount: number;
        purchaseCount: number;
        favoriteCount: number;
      };
    }>>(`/books/${bookId}/statistics`);
    
    if (res.data.success && res.data.data) {
      return res.data.data.statistics;
    }
    
    return {
      viewCount: 0,
      borrowCount: 0,
      purchaseCount: 0,
      favoriteCount: 0,
    };
  } catch (error) {
    console.error("Error fetching book statistics:", error);
    return {
      viewCount: 0,
      borrowCount: 0,
      purchaseCount: 0,
      favoriteCount: 0,
    };
  }
};


// ==================== MEMBERSHIP APIs ====================

/**
 * Lấy danh sách tất cả gói thành viên (Public - không cần auth)
 * GET /api/memberships/plans
 */
export const getAllMembershipPlans = async (): Promise<MembershipPlan[]> => {
  try {
    const res = await api.get<MembershipPlansResponse>('/memberships/plans');
    
    if (res.data.success && res.data.data?.plans) {
      return res.data.data.plans;
    }
    
    return [];
  } catch (error) {
    console.error('[MembershipAPI] getAllMembershipPlans error:', error);
    return [];
  }
};

/**
 * Lấy chi tiết gói thành viên theo ID (Public - không cần auth)
 * GET /api/memberships/plans/:id
 */
export const getMembershipPlanById = async (planId: string): Promise<MembershipPlan> => {
  try {
    const res = await api.get<MembershipPlanResponse>(`/memberships/plans/${planId}`);
    
    if (res.data.success && res.data.data?.plan) {
      return res.data.data.plan;
    }
    
    throw new Error(res.data.message || 'Plan not found');
  } catch (error) {
    console.error('[MembershipAPI] getMembershipPlanById error:', error);
    
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Không tìm thấy gói thành viên';
      throw new Error(message);
    }
    
    throw error;
  }
};

/**
 * Lấy thông tin membership hiện tại của user
 * GET /api/memberships/me
 */
export const getMyMembership = async (): Promise<UserMembership | null> => {
  try {
    const res = await api.get<UserMembershipResponse>('/memberships/me');
    
    if (res.data.success && res.data.data?.membership) {
      return res.data.data.membership;
    }
    
    return null;
  } catch (error) {
    console.error('[MembershipAPI] getMyMembership error:', error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    
    throw error;
  }
};

/**
 * Đăng ký gói thành viên mới
 * POST /api/memberships/subscribe
 */
export const subscribeMembership = async (planId: string): Promise<{
  paymentLink: string;
  paymentId: string;
  amount: number;
}> => {
  try {
    console.log('🔵 [MembershipAPI] Subscribing to plan:', planId);
    
    const res = await api.post<{
      success: boolean;
      data: {
        paymentLink: string;
        paymentId: string;
        amount: number;
      };
      message?: string;
    }>('/memberships/subscribe', { 
      membershipPlanId: planId  // ✅ Backend expects "membershipPlanId"
    });
    
    console.log('✅ [MembershipAPI] Subscribe response:', res.data);
    
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    
    throw new Error(res.data.message || 'Subscribe failed');
  } catch (error) {
    console.error('[MembershipAPI] subscribeMembership error:', error);
    
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Không thể đăng ký gói thành viên';
      throw new Error(message);
    }
    
    throw error;
  }
};

/**
 * Hủy đăng ký gói thành viên
 * POST /api/memberships/cancel
 */
export const cancelMembership = async (): Promise<void> => {
  try {
    const res = await api.post<{ success: boolean; message?: string }>('/memberships/cancel');
    
    if (!res.data.success) {
      throw new Error(res.data.message || 'Cancel failed');
    }
  } catch (error) {
    console.error('[MembershipAPI] cancelMembership error:', error);
    
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'Không thể hủy gói thành viên';
      throw new Error(message);
    }
    
    throw error;
  }
};

/**
 * Kiểm tra user có membership active không
 * GET /api/memberships/check
 */
export const checkMembershipStatus = async (): Promise<{
  hasMembership: boolean;
  membership?: UserMembership;
  canBorrow: boolean;
  borrowsRemaining: number;
}> => {
  try {
    const res = await api.get<UserMembershipResponse>('/memberships/me');

    console.log('🔍 [DEBUG] Full API response:', res.data);
    console.log('🔍 [DEBUG] res.data.success:', res.data.success);
    console.log('🔍 [DEBUG] res.data.data:', res.data.data);

    // API trả về 'subscription' chứ không phải 'membership'
    const membership = res.data.data?.membership || (res.data.data as { subscription?: UserMembership })?.subscription;

    if (res.data.success && res.data.data && membership) {
      console.log('✅ [DEBUG] Membership found:', membership);
      console.log('✅ [DEBUG] membership.plan:', membership.plan);
      console.log('✅ [DEBUG] membership.currentBorrows:', membership.currentBorrows);

      const isActive = membership.status === 'Active';
      const maxBooks = membership.plan?.maxBooks || 5;
      const currentBorrows = membership.currentBorrows || 0;
      const borrowsRemaining = isActive ? Math.max(0, maxBooks - currentBorrows) : 0;

      console.log('✅ [DEBUG] isActive:', isActive);
      console.log('✅ [DEBUG] maxBooks:', maxBooks);
      console.log('✅ [DEBUG] currentBorrows:', currentBorrows);
      console.log('✅ [DEBUG] borrowsRemaining:', borrowsRemaining);

      return {
        hasMembership: true,
        membership: membership,
        canBorrow: isActive && borrowsRemaining > 0,
        borrowsRemaining: borrowsRemaining,
      };
    }

    console.warn('⚠️ [DEBUG] No membership found in response');
    return {
      hasMembership: false,
      canBorrow: false,
      borrowsRemaining: 0,
    };
  } catch (error) {
    console.error('[MembershipAPI] checkMembershipStatus error:', error);
    return {
      hasMembership: false,
      canBorrow: false,
      borrowsRemaining: 0,
    };
  }

};

// ==================== NOTIFICATION APIs ====================

/**
 * ✅ NEW: Lấy danh sách notifications (unified endpoint)
 * GET /api/notifications?status=unread&page=1&limit=10
 */
export const getNotifications = async (
  status: 'unread' | 'read' | 'all' = 'unread',
  page: number = 1,
  limit: number = 10
): Promise<{
  notifications: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  try {
    const params: Record<string, string | number> = { page, limit };
    if (status !== 'all') {
      params.status = status;
    }

    const res = await api.get<{
      success: boolean;
      data: {
        notifications: NotificationItem[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>('/notifications', { params });
    
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    
    return {
      notifications: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  } catch (error) {
    console.error('[NotificationAPI] getNotifications error:', error);
    return {
      notifications: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }
};

/**
 * ✅ UPDATED: Lấy danh sách sách yêu thích đã available (wrapper cho getNotifications)
 * Giữ lại để backward compatibility
 */
export const getFavoriteBookNotifications = async (): Promise<NotificationItem[]> => {
  try {
    // Gọi endpoint mới với filter type
    const result = await getNotifications('unread', 1, 50);
    
    // Lọc chỉ lấy notifications về favorite books
    const favoriteNotifications = result.notifications.filter(
      notif => notif.type === 'favorite-available'
    );
    
    return favoriteNotifications;
  } catch (error) {
    console.error('[NotificationAPI] getFavoriteBookNotifications error:', error);
    return [];
  }
};

/**
 * ✅ NEW: Đánh dấu đã đọc một notification
 * PATCH /api/notifications/:notificationId/read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('[NotificationAPI] markNotificationAsRead error:', error);
    throw error;
  }
};

/**
 * ✅ NEW: Đánh dấu tất cả notifications đã đọc
 * PATCH /api/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await api.patch('/notifications/mark-all-read');
  } catch (error) {
    console.error('[NotificationAPI] markAllNotificationsAsRead error:', error);
    throw error;
  }
};

/**
 * ✅ NEW: Xóa notification
 * DELETE /api/notifications/:notificationId
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (error) {
    console.error('[NotificationAPI] deleteNotification error:', error);
    throw error;
  }
};

/**
 * @deprecated Use markNotificationAsRead instead
 * Giữ lại để backward compatibility với code cũ
 */
export const markNotificationAsReadLegacy = async (bookId: string): Promise<void> => {
  try {
    // Tìm notification theo bookId và mark as read
    const result = await getNotifications('unread', 1, 100);
    const notification = result.notifications.find(n => n.bookId === bookId);
    
    if (notification) {
      await markNotificationAsRead(notification._id);
    }
  } catch (error) {
    console.error('[NotificationAPI] markNotificationAsReadLegacy error:', error);
    throw error;
  }
};


// ==================== DASHBOARD/STATISTICS API ====================

/**
 * Lấy thống kê tổng quan của thư viện
 * GET /api/dashboard/statistics
 */
export const getDashboardStatistics = async (): Promise<{
  totalBooks: number;
  totalReaders: number;
  totalBorrowsLast30Days: number;
  averageRating: number;
}> => {
  try {
    const res = await api.get<{
      success: boolean;
      data: {
        totalBooks: number;
        totalReaders: number;
        totalBorrowsLast30Days: number;
        averageRating: number;
      };
    }>('/dashboard/statistics');
    
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    
    // Fallback data nếu API fail
    return {
      totalBooks: 0,
      totalReaders: 0,
      totalBorrowsLast30Days: 0,
      averageRating: 0,
    };
  } catch (error) {
    console.error('[DashboardAPI] getDashboardStatistics error:', error);
    
    // Return fallback data on error
    return {
      totalBooks: 0,
      totalReaders: 0,
      totalBorrowsLast30Days: 0,
      averageRating: 0,
    };
  }
};
// ==================== EXPORT ====================

export default {
  // Book operations
  getBooksWithFilters,
  getBooksByCategory,
  getRelatedBooks,
  updateBook,
  incrementBookView,
  incrementBorrowCount,
  
  // Review operations
  getBookReviews,
  addBookReview,
  updateReviewHelpful,
  deleteReview,
  
  // Rental payment (NEW)
  createRentalPaymentLink,
  
  // Borrow operations (UPDATED)
  borrowBook,              // NEW unified version
  borrowBookLegacy,        // OLD version for backward compatibility
  getCurrentBorrows,
  getMyBorrows,
  returnBook,
  extendBorrow,
  renewBorrow,
  
  // Reserve operations
  reserveBook,
  getMyReservations,
  cancelReservation,
  updateReservation,
  getReservationById,

  // Favorite operations
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  getUserFavoritesWithBooks,


  
  // Statistics
  getBookStatistics,


  // Membership operations
  getAllMembershipPlans,
  getMembershipPlanById,
  getMyMembership,
  subscribeMembership,
  cancelMembership,
  checkMembershipStatus,


  // Notification operations
getNotifications,                    
  getFavoriteBookNotifications,         
  markNotificationAsRead,              
  markAllNotificationsAsRead,          
  deleteNotification,                  
  markNotificationAsReadLegacy,    

  // Dashboard operations
  getDashboardStatistics,
};

// Membership Service - for checking membership status in components
export const membershipService = {
  getMembershipStatus: checkMembershipStatus,
};






