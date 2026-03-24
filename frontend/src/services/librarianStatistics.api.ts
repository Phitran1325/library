// ==================== LIBRARIAN STATISTICS API ====================
// API service for Librarian statistics and dashboard data
// Base endpoint: /api/librarian/statistics

import axios from 'axios';

// ==================== AXIOS INSTANCE ====================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // Tăng lên 30 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== REQUEST INTERCEPTOR ====================

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

// ==================== RESPONSE INTERCEPTOR ====================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[Librarian Statistics API] Unauthorized');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// ==================== TYPESCRIPT INTERFACES ====================

export interface LibrarianStatistics {
  overview: {
    totalBooksCreated: number;
    totalBookCopiesCreated: number;
    totalBooksMarkedLost: number;
    totalBooksMarkedDamaged: number;
    totalReservationsRejected: number;
    totalViolationsRecorded: number;
    totalLateFeesRecorded: number;
    totalDamageFeesRecorded: number;
  };
  books: {
    totalCreated: number;
    byCategory: Record<string, number>;
    newReleases: number;
    createdInPeriod: number;
  };
  bookCopies: {
    totalCreated: number;
    byStatus: Record<string, number>;
    byCondition: Record<string, number>;
    createdInPeriod: number;
  };
  borrows: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    overdue: number;
    totalLateFees: number;
    totalDamageFees: number;
  };
  reservations: {
    total: number;
    byStatus: Record<string, number>;
    rejected: number;
  };
  violations: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  timeline: {
    today: Partial<LibrarianStatistics['overview']>;
    thisWeek: Partial<LibrarianStatistics['overview']>;
    thisMonth: Partial<LibrarianStatistics['overview']>;
  };
}

export interface Activity {
  type: 'mark_lost' | 'mark_damaged' | 'reject_reservation';
  action: string;
  borrow?: {
    id: string;
    book: any;
    user: any;
    lateFee: number;
    damageFee: number;
  };
  reservation?: {
    id: string;
    book: any;
    user: any;
    reason?: string;
  };
  createdAt: Date;
}

export interface ActivityHistoryData {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// ==================== API FUNCTIONS ====================

/**
 * 1. Lấy thống kê cá nhân của thủ thư
 * GET /api/librarian/statistics/personal
 *
 * @param period - Khoảng thời gian ('today' | 'week' | 'month' | 'year' | 'all')
 * @returns Promise<LibrarianStatistics>
 */
export const getPersonalStatistics = async (
  period: 'today' | 'week' | 'month' | 'year' | 'all' = 'all'
): Promise<LibrarianStatistics> => {
  try {
    const res = await api.get<ApiResponse<LibrarianStatistics>>(
      '/librarian/statistics/personal',
      { params: { period } }
    );

    if (res.data.success && res.data.data) {
      return res.data.data;
    }

    throw new Error('Không thể tải thống kê');
  } catch (error: any) {
    console.error('Error fetching personal statistics:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Không thể tải thống kê cá nhân!'
    );
  }
};

/**
 * 2. Lấy lịch sử hoạt động của thủ thư
 * GET /api/librarian/statistics/personal/activity-history
 *
 * @param page - Trang hiện tại (default: 1)
 * @param limit - Số lượng mỗi trang (default: 20)
 * @returns Promise<ActivityHistoryData>
 */
export const getActivityHistory = async (
  page: number = 1,
  limit: number = 20
): Promise<ActivityHistoryData> => {
  try {
    const res = await api.get<ApiResponse<ActivityHistoryData>>(
      '/librarian/statistics/personal/activity-history',
      { params: { page, limit } }
    );

    if (res.data.success && res.data.data) {
      return res.data.data;
    }

    throw new Error('Không thể tải lịch sử hoạt động');
  } catch (error: any) {
    console.error('Error fetching activity history:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Không thể tải lịch sử hoạt động!'
    );
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  getPersonalStatistics,
  getActivityHistory,
};
