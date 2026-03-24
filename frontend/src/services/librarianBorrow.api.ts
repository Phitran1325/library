import axios from 'axios';
import type { ApiResponse, BorrowsData } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[Librarian Borrow API] Response Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Librarian Borrow API] No response:', error.request);
    } else {
      console.error('[Librarian Borrow API] Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export interface BorrowListFilters {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  userName?: string;
  bookId?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

const buildParams = (filters: BorrowListFilters) => {
  const params: Record<string, string | number> = {
    page: filters.page || 1,
    limit: filters.limit || 10,
  };

  if (filters.status) params.status = filters.status;
  if (filters.userId) params.userId = filters.userId;
  if (filters.userName) params.userName = filters.userName;
  if (filters.bookId) params.bookId = filters.bookId;
  if (filters.search) params.search = filters.search;
  if (filters.sort) params.sort = filters.sort;
  if (filters.order) params.order = filters.order;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  return params;
};

export const getBorrowRecords = async (filters: BorrowListFilters = {}): Promise<BorrowsData> => {
  try {
    const params = buildParams(filters);
    console.log('🔍 [getBorrowRecords] Fetching with params:', params);

    const res = await api.get<ApiResponse<BorrowsData>>('/borrows', {
      params,
    });

    console.log('✅ [getBorrowRecords] Response:', res.data);
    console.log('✅ [getBorrowRecords] Borrows count from API:', res.data?.data?.borrows?.length);
    console.log('✅ [getBorrowRecords] Pagination from API:', res.data?.data?.pagination);

    // Check for null user/book
    const allBorrows = res.data?.data?.borrows || [];
    const validBorrows = allBorrows.filter((b: any) => b.user && b.book);
    const invalidBorrows = allBorrows.filter((b: any) => !b.user || !b.book);

    console.log('✅ [getBorrowRecords] Valid borrows (has user & book):', validBorrows.length);
    console.log('⚠️ [getBorrowRecords] Invalid borrows (null user/book):', invalidBorrows.length);

    if (invalidBorrows.length > 0) {
      console.warn('⚠️ [getBorrowRecords] Invalid borrow details:', invalidBorrows.map((b: any) => ({
        id: b._id,
        status: b.status,
        borrowType: b.borrowType,
        hasUser: !!b.user,
        hasBook: !!b.book,
        userId: b.user?._id || b.user,
        bookId: b.book?._id || b.book
      })));
    }

    if (res.data?.success && res.data.data) {
      return res.data.data;
    }

    throw new Error(res.data?.message || 'Không thể tải danh sách mượn trả');
  } catch (error: any) {
    console.error('[Librarian Borrow API] getBorrowRecords error:', error);
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể tải danh sách mượn trả';
    throw new Error(message);
  }
};

export const returnBorrowRecord = async (
  borrowId: string,
  payload: { bookCondition?: string; notes?: string } = {}
) => {
  try {
    const res = await api.post<ApiResponse<any>>(`/borrows/${borrowId}/return`, payload);
    if (res.data?.success) {
      return res.data.data?.borrow;
    }
    throw new Error(res.data?.message || 'Trả sách thất bại');
  } catch (error: any) {
    console.error('[Librarian Borrow API] returnBorrowRecord error:', error);
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể trả sách';
    throw new Error(message);
  }
};

export const sendBorrowReminder = async (
  borrowId: string,
  customMessage?: string
) => {
  try {
    const res = await api.post<ApiResponse<any>>(`/borrows/${borrowId}/send-reminder`, {
      customMessage,
    });
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Gửi nhắc nhở thất bại');
  } catch (error: any) {
    console.error('[Librarian Borrow API] sendBorrowReminder error:', error);
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể gửi nhắc nhở';
    throw new Error(message);
  }
};

export const markBorrowAsLost = async (borrowId: string, notes?: string) => {
  try {
    const res = await api.post<ApiResponse<any>>(`/borrows/${borrowId}/mark-lost`, {
      notes,
    });
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Đánh dấu mất thất bại');
  } catch (error: any) {
    console.error('[Librarian Borrow API] markBorrowAsLost error:', error);
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể đánh dấu mất';
    throw new Error(message);
  }
};

export const markBorrowAsDamaged = async (
  borrowId: string,
  damageLevel: 'Damaged' | 'SeverelyDamaged',
  notes?: string
) => {
  try {
    const res = await api.post<ApiResponse<any>>(`/borrows/${borrowId}/mark-damaged`, {
      damageLevel,
      notes,
    });
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Đánh dấu hư hỏng thất bại');
  } catch (error: any) {
    console.error('[Librarian Borrow API] markBorrowAsDamaged error:', error);
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể đánh dấu hư hỏng';
    throw new Error(message);
  }
};

/**
 * Approve pending borrow request (Librarian only)
 */
export const approveBorrowRequest = async (borrowId: string) => {
  try {
    const res = await api.post<ApiResponse<any>>(`/borrows/${borrowId}/approve`);
    if (res.data?.success) {
      return res.data.data?.borrow;
    }
    throw new Error(res.data?.message || 'Chấp nhận yêu cầu thất bại');
  } catch (error: any) {
    console.error('[Librarian Borrow API] approveBorrowRequest error:', error);
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể chấp nhận yêu cầu mượn sách';
    throw new Error(message);
  }
};

/**
 * Reject pending borrow request (Librarian only)
 */
export const rejectBorrowRequest = async (borrowId: string, reason?: string) => {
  try {
    const res = await api.post<ApiResponse<any>>(`/borrows/${borrowId}/reject`, {
      reason,
    });
    if (res.data?.success) {
      return res.data.data?.borrow;
    }
    throw new Error(res.data?.message || 'Từ chối yêu cầu thất bại');
  } catch (error: any) {
    console.error('[Librarian Borrow API] rejectBorrowRequest error:', error);
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể từ chối yêu cầu mượn sách';
    throw new Error(message);
  }
};

