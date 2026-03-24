import axios from "axios";
import type { Book, Banner } from "../types";

const api = axios.create({ 
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});
// Base API URL - cập nhật theo URL của bạn
const API_BASE_URL = 'http://localhost:5000/api'; // Thay bằng URL thực tế của bạn

// Interface cho response từ API
interface ApiResponse<T> {
  success: boolean;
  data: T;
} 

interface BooksResponse {
  books: Book[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}


// ==================== INTERCEPTORS ====================

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[API Response Error]:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[API No Response]:', error.request);
    } else {
      console.error('[API Setup Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

// ==================== BOOKS - BASIC APIs ====================

// Fetch tất cả sách
export const getAllBooks = async (
  page: number = 1,
  limit: number = 10
): Promise<Book[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/books?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<BooksResponse> = await response.json();
    
    if (!result.success) {
      throw new Error('API returned unsuccessful response');
    }

    return result.data.books;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};


/**
 * Lấy tất cả sách với phân trang và thông tin chi tiết
 * Trả về cả books và pagination info
 */
export const getAllBooksWithPagination = async (
  page: number = 1,
  limit: number = 10
): Promise<BooksResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/books?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<BooksResponse> = await response.json();
    
    if (!result.success) {
      throw new Error('API returned unsuccessful response');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching books with pagination:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của một sách theo ID
 */
export const getBookById = async (id: string): Promise<Book> => {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Book> = await response.json();

    if (!result.success) {
      throw new Error('API returned unsuccessful response');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching book by ID:', error);
    throw error;
  }
};


/**
 * Lấy sách phổ biến/hot books
 * Có thể dùng để lấy popularBooks và newBooks
 */
export const getHotBooks = async (limit: number = 10): Promise<Book[]> => {
  try {
    // Nếu API có endpoint riêng cho hot books, sử dụng endpoint đó
    // Nếu không, có thể filter hoặc sort từ getAllBooks
    const response = await fetch(
      `${API_BASE_URL}/books?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<BooksResponse> = await response.json();
    
    if (!result.success) {
      throw new Error('API returned unsuccessful response');
    }

    // Sort theo rating để lấy sách phổ biến
    const sortedBooks = result.data.books.sort((a, b) => b.rating - a.rating);
    
    return sortedBooks;
  } catch (error) {
    console.error('Error fetching hot books:', error);
    throw error;
  }
};

/**
 * Lấy sách mới nhất
 */
export const getNewReleaseBooks = async (limit: number = 5): Promise<Book[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/books?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<BooksResponse> = await response.json();
    
    if (!result.success) {
      throw new Error('API returned unsuccessful response');
    }

    // Filter sách mới hoặc sort theo ngày tạo
    const newBooks = result.data.books
      .filter(book => book.isNewRelease || book.status === 'available')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return newBooks;
  } catch (error) {
    console.error('Error fetching new release books:', error);
    throw error;
  }
};
// ==================== BANNERS ====================

// Fetch tất cả banners
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const res = await api.get<Banner[]>("/banners");
    return res.data;
  } catch (error) {
    console.error("Error fetching banners:", error);
    throw new Error("Không thể tải danh sách banners!");
  }
};

// ==================== EXPORT ====================

export default {
  getAllBooks,
  getAllBooksWithPagination,
  getHotBooks,
  getNewReleaseBooks,
  getAllBanners,
  getBookById
};