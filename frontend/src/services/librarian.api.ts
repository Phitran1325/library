// ==================== LIBRARIAN BOOKS API ====================
// API service for Librarian role to manage books
// Base endpoint: /api/admin/books (shared with Admin)

import axios from 'axios';
import type { Book, BooksData, ApiResponse, Author, Publisher } from '../types';

// ==================== AXIOS INSTANCE ====================

/**
 * Create axios instance for Librarian Books API
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// ==================== REQUEST INTERCEPTOR ====================

/**
 * Tự động thêm Bearer token vào mọi request
 */
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

/**
 * Xử lý lỗi response (401, 403, network errors)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Handle 401 Unauthorized
      if (status === 401) {
        console.error('[Librarian API] Unauthorized - Token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
      }

      // Handle 403 Forbidden (không có quyền Librarian)
      if (status === 403) {
        console.error('[Librarian API] Forbidden - Not a Librarian role');
      }

      console.error('[Librarian API Response Error]:', status, error.response.data);
    } else if (error.request) {
      console.error('[Librarian API No Response]:', error.request);
    } else {
      console.error('[Librarian API Setup Error]:', error.message);
    }

    return Promise.reject(error);
  }
);

// ==================== TYPESCRIPT INTERFACES ====================

/**
 * Filters cho danh sách sách của Librarian
 */
export interface LibrarianBookFilters {
  page?: number;
  limit?: number;
  category?: string;
  categoryId?: string;
  status?: string;
  isActive?: boolean | string; // backend expects 'true' | 'false' string
  isNewRelease?: boolean | string;
  author?: string; // legacy alias for authorId
  authorId?: string;
  authorName?: string;
  publisher?: string; // legacy alias for publisherId
  publisherId?: string;
  title?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Data để tạo sách mới
 */
export interface CreateBookRequest {
  title: string;
  isbn?: string;
  description?: string;
  coverImage?: string;
  pages?: number;
  publicationYear?: number;
  publishedDate?: string;
  language: string;
  category: string;
  categoryId?: string;
  price?: number;
  rentalPrice: number;
  stock?: number;
  available?: number;
  volume?: number;
  isNewRelease?: boolean;
  authorId: string;
  publisherId: string;
  tags?: string[];
}

// ==================== API FUNCTIONS ====================

/**
 * 1. Lấy danh sách tất cả sách với filter và pagination
 * GET /api/admin/books
 *
 * @param filters - Các tham số filter (category, status, search, pagination, etc.)
 * @returns Promise<BooksData> - Danh sách sách và pagination info
 */
export const getAllLibrarianBooks = async (
  filters: LibrarianBookFilters = {}
): Promise<BooksData> => {
  try {
    const params: Record<string, string | number | boolean> = {
      page: filters.page || 1,
      limit: filters.limit || 10,
    };

    // Add optional filters
    if (filters.category) params.category = filters.category;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.status) params.status = filters.status;
    if (filters.isActive !== undefined && filters.isActive !== '') {
      params.isActive = filters.isActive;
    }
    if (filters.isNewRelease !== undefined) {
      params.isNewRelease = filters.isNewRelease;
    }
    if (filters.authorId || filters.author) {
      params.authorId = filters.authorId || filters.author!;
    }
    if (filters.authorName) params.authorName = filters.authorName;
    if (filters.publisherId || filters.publisher) {
      params.publisherId = filters.publisherId || filters.publisher!;
    }
    if (filters.title) params.title = filters.title;
    if (filters.search) params.search = filters.search;
    if (filters.sort) params.sort = filters.sort;
    if (filters.order) params.order = filters.order;

    console.log('[librarian.api] Making request with params:', params);

    const res = await api.get('/librarian/books', { params });

    console.log('[librarian.api] Full axios response:', res);
    console.log('[librarian.api] Response data:', res.data);
    console.log('[librarian.api] Response data type:', typeof res.data);
    console.log('[librarian.api] Response data.success:', res.data?.success);
    console.log('[librarian.api] Response data.data:', res.data?.data);

    // Backend trả về { success: true, data: { books: [...], pagination: {...} } }
    if (res.data && res.data.success && res.data.data) {
      console.log('[librarian.api] ✅ Returning books:', res.data.data.books?.length, 'books');
      return res.data.data;
    }

    console.warn('[librarian.api] ⚠️ Response không có data hợp lệ, returning empty');
    // Fallback nếu không có data
    return {
      books: [],
      pagination: {
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
        pages: 0,
      },
    };
  } catch (error) {
    console.error('[librarian.api] ❌ Error fetching books:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Không thể tải danh sách sách!'
    );
  }
};

/**
 * 2. Lấy danh sách sách mới phát hành
 * GET /api/admin/books/new-releases
 *
 * @param limit - Số lượng sách (mặc định 10)
 * @returns Promise<Book[]> - Danh sách sách mới
 */
export const getNewReleases = async (limit: number = 10): Promise<Book[]> => {
  try {
    const res = await api.get<ApiResponse<{ books: Book[] }>>(
      '/admin/books/new-releases',
      { params: { limit } }
    );

    if (res.data.success && res.data.data) {
      return res.data.data.books || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching new releases:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Không thể tải sách mới phát hành!'
    );
  }
};

/**
 * 3. Lấy sách theo số tập (volume)
 * GET /api/admin/books/by-volume/:volume
 *
 * @param volume - Số tập
 * @param page - Trang hiện tại (mặc định 1)
 * @param limit - Số lượng mỗi trang (mặc định 10)
 * @returns Promise<BooksData> - Danh sách sách và pagination
 */
export const getBooksByVolume = async (
  volume: number,
  page: number = 1,
  limit: number = 10
): Promise<BooksData> => {
  try {
    const res = await api.get<ApiResponse<BooksData>>(
      `/admin/books/by-volume/${volume}`,
      { params: { page, limit } }
    );

    if (res.data.success && res.data.data) {
      return res.data.data;
    }

    return {
      books: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching books by volume:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Không thể tải sách theo số tập!'
    );
  }
};

/**
 * 4. Lấy thông tin chi tiết một cuốn sách
 * GET /api/admin/books/:id
 *
 * @param id - ID của sách
 * @returns Promise<Book> - Thông tin chi tiết sách
 */
export const getLibrarianBookById = async (id: string): Promise<Book> => {
  try {
    const res = await api.get<ApiResponse<{ book: Book }>>(
      `/librarian/books/${id}`
    );

    if (res.data.success && res.data.data) {
      return res.data.data.book;
    }

    throw new Error('Sách không tồn tại');
  } catch (error) {
    console.error('Error fetching librarian book by id:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Không thể tải thông tin sách!'
    );
  }
};

/**
 * 5. Tạo sách mới
 * POST /api/admin/books
 *
 * @param bookData - Dữ liệu sách cần tạo
 * @returns Promise<Book> - Sách vừa được tạo
 */
export const createBook = async (bookData: CreateBookRequest): Promise<Book> => {
  try {
    const res = await api.post<ApiResponse<{ book: Book }>>(
      '/librarian/books',
      bookData
    );

    if (res.data.success && res.data.data) {
      return res.data.data.book;
    }

    throw new Error('Tạo sách thất bại');
  } catch (error: any) {
    console.error('Error creating book:', error);

    // Extract error message from backend response
    const errorMessage = error.response?.data?.message ||
                        error.message ||
                        'Không thể tạo sách mới!';

    throw new Error(errorMessage);
  }
};

/**
 * 6. Cập nhật thông tin sách
 * PUT /api/admin/books/:id
 *
 * @param id - ID của sách cần cập nhật
 * @param bookData - Dữ liệu sách cần cập nhật
 * @returns Promise<Book> - Sách sau khi được cập nhật
 */
export const updateBook = async (
  id: string,
  bookData: Partial<CreateBookRequest>
): Promise<Book> => {
  try {
    const res = await api.put<ApiResponse<{ book: Book }>>(
      `/librarian/books/${id}`,
      bookData
    );

    if (res.data.success && res.data.data) {
      return res.data.data.book;
    }

    throw new Error('Cập nhật sách thất bại');
  } catch (error: any) {
    console.error('Error updating book:', error);

    // Extract error message from backend response
    const errorMessage = error.response?.data?.message ||
                        error.message ||
                        'Không thể cập nhật sách!';

    throw new Error(errorMessage);
  }
};

/**
 * 7. Xóa sách
 * DELETE /api/admin/books/:id
 *
 * @param id - ID của sách cần xóa
 * @returns Promise<void>
 */
export const deleteBook = async (id: string): Promise<void> => {
  try {
    const res = await api.delete<ApiResponse<any>>(
      `/librarian/books/${id}`
    );

    if (!res.data.success) {
      throw new Error(res.data.message || 'Xóa sách thất bại');
    }
  } catch (error: any) {
    console.error('Error deleting book:', error);

    // Extract error message from backend response
    const errorMessage = error.response?.data?.message ||
                        error.message ||
                        'Không thể xóa sách!';

    throw new Error(errorMessage);
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  getAllLibrarianBooks,
  getNewReleases,
  getBooksByVolume,
  getLibrarianBookById,
  createBook,
  updateBook,
  deleteBook,
};

// Lấy toàn bộ tác giả
export const getAuthors = async () => {
  const res = await api.get<ApiResponse<Author[]>>('/librarian/books/authors');
  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.message || 'Không thể tải danh sách tác giả');
};

// Lấy toàn bộ nhà xuất bản
export const getPublishers = async () => {
  const res = await api.get<ApiResponse<Publisher[]>>('/librarian/books/publishers');
  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.message || 'Không thể tải danh sách nhà xuất bản');
};

// Lấy toàn bộ tags
export const getTags = async () => {
  const res = await api.get<ApiResponse<{ name: string }[]>>('/librarian/books/tags');
  if (res.data?.success && Array.isArray(res.data.data)) {
    return res.data.data.map(tag => tag.name);
  }
  throw new Error(res.data?.message || 'Không thể tải danh sách tag');
};

