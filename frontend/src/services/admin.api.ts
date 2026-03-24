import axios, { type AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const withAuth = (token?: string, config: AxiosRequestConfig = {}): AxiosRequestConfig => ({
  ...config,
  headers: {
    'Content-Type': 'application/json',
    ...(config.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

// Categories (admin actions share public /categories endpoint)
export const getCategories = (token?: string, config?: AxiosRequestConfig) =>
  axios.get(`${API_BASE_URL}/categories`, withAuth(token, config));
export const createCategory = (payload: any, token?: string, config?: AxiosRequestConfig) =>
  axios.post(`${API_BASE_URL}/categories`, payload, withAuth(token, config));
export const updateCategory = (id: string, payload: any, token?: string, config?: AxiosRequestConfig) =>
  axios.put(`${API_BASE_URL}/categories/${id}`, payload, withAuth(token, config));
export const deleteCategory = (id: string, token?: string, config?: AxiosRequestConfig) =>
  axios.delete(`${API_BASE_URL}/categories/${id}`, withAuth(token, config));

// Publishers
export const getPublishers = (token?: string, config?: AxiosRequestConfig) =>
  axios.get(`${API_BASE_URL}/admin/publishers`, withAuth(token, config));
export const createPublisher = (payload: any, token?: string, config?: AxiosRequestConfig) =>
  axios.post(`${API_BASE_URL}/admin/publishers`, payload, withAuth(token, config));
export const updatePublisher = (id: string, payload: any, token?: string, config?: AxiosRequestConfig) =>
  axios.put(`${API_BASE_URL}/admin/publishers/${id}`, payload, withAuth(token, config));
export const deletePublisher = (id: string, token?: string, config?: AxiosRequestConfig) =>
  axios.delete(`${API_BASE_URL}/admin/publishers/${id}`, withAuth(token, config));

// Authors
export const getAuthors = (token?: string, config?: AxiosRequestConfig) =>
  axios.get(`${API_BASE_URL}/admin/authors`, withAuth(token, config));
export const createAuthor = (payload: any, token?: string, config?: AxiosRequestConfig) =>
  axios.post(`${API_BASE_URL}/admin/authors`, payload, withAuth(token, config));
export const updateAuthor = (id: string, payload: any, token?: string, config?: AxiosRequestConfig) =>
  axios.put(`${API_BASE_URL}/admin/authors/${id}`, payload, withAuth(token, config));
export const deleteAuthor = (id: string, token?: string, config?: AxiosRequestConfig) =>
  axios.delete(`${API_BASE_URL}/admin/authors/${id}`, withAuth(token, config));

// Reservations
export const getReservations = (params = '', token?: string, config?: AxiosRequestConfig) =>
  axios.get(`${API_BASE_URL}/admin/reservations${params}`, withAuth(token, config));
export const approveReservation = (id: string, token?: string, config?: AxiosRequestConfig) =>
  axios.post(`${API_BASE_URL}/admin/reservations/${id}/approve`, undefined, withAuth(token, config));
export const denyReservation = (id: string, payload: { reason?: string }, token?: string, config?: AxiosRequestConfig) =>
  axios.post(`${API_BASE_URL}/admin/reservations/${id}/deny`, payload, withAuth(token, config));

// Borrowing rules (placeholder endpoints – implement in backend when available)
export const getBorrowRules = (token?: string, config?: AxiosRequestConfig) =>
  axios.get(`${API_BASE_URL}/admin/borrow-rules`, withAuth(token, config));
export const saveBorrowRules = (payload: any, token?: string, config?: AxiosRequestConfig) =>
  axios.post(`${API_BASE_URL}/admin/borrow-rules`, payload, withAuth(token, config));

// User Management
export const getAllUsers = async (token?: string, config?: AxiosRequestConfig) => {
  const response = await axios.get(`${API_BASE_URL}/admin/users`, withAuth(token, config));
  // Backend returns { success: true, data: { users: [...], pagination: {...} } }
  return response.data?.data?.users || response.data || [];
};

export const updateUserRole = async (
  userId: string,
  role: 'Admin' | 'Librarian' | 'Reader',
  token?: string,
  config?: AxiosRequestConfig
) => {
  const response = await axios.put(
    `${API_BASE_URL}/admin/update-role/${userId}`,
    { role },
    withAuth(token, config)
  );
  return response.data;
};

export const lockUserAccount = async (userId: string, token?: string, config?: AxiosRequestConfig) => {
  const response = await axios.put(
    `${API_BASE_URL}/admin/toggle-status/${userId}`,
    { isActive: false },
    withAuth(token, config)
  );
  return response.data;
};

export const unlockUserAccount = async (userId: string, token?: string, config?: AxiosRequestConfig) => {
  const response = await axios.put(
    `${API_BASE_URL}/admin/toggle-status/${userId}`,
    { isActive: true },
    withAuth(token, config)
  );
  return response.data;
};

export const getUserStatistics = async (period: string = 'all', token?: string, config?: AxiosRequestConfig) => {
  const response = await axios.get(
    `${API_BASE_URL}/admin/users/statistics?period=${period}`,
    withAuth(token, config)
  );
  return response.data?.data || response.data;
};

// Book Statistics
export const getBookStatistics = async (period: string = 'all', token?: string, config?: AxiosRequestConfig) => {
  const response = await axios.get(
    `${API_BASE_URL}/admin/books/statistics?period=${period}`,
    withAuth(token, config)
  );
  return response.data?.data || response.data;
};

// Auto-lock functions
export const autoLockOverdueUsers = async (token?: string, config?: AxiosRequestConfig) => {
  const response = await axios.post(
    `${API_BASE_URL}/admin/users/auto-lock-overdue`,
    {},
    withAuth(token, config)
  );
  return response.data;
};

export const autoLockPenaltyDebtUsers = async (token?: string, config?: AxiosRequestConfig) => {
  const response = await axios.post(
    `${API_BASE_URL}/admin/users/auto-lock-penalty-debt`,
    {},
    withAuth(token, config)
  );
  return response.data;
};
// Admin Dashboard
export const getAdminDashboard = (token?: string, config?: AxiosRequestConfig) =>
  axios.get(`${API_BASE_URL}/admin/dashboard`, withAuth(token, config));

export interface AdminUser {
  id: number | string;
  fullName?: string;
  username?: string;
  email: string;
  role?: string;
}

export interface BookItem {
  id: number | string;
  title: string;
  image?: string;
  price?: string;
}

export const getUsers = async (): Promise<AdminUser[]> => {
  const response = await fetch('/db.json');
  if (!response.ok) {
    throw new Error('Failed to load db.json');
  }
  const data = await response.json();
  return data.users ?? [];
};

export const getBooks = async (): Promise<BookItem[]> => {
  const response = await fetch('/db.json');
  if (!response.ok) {
    throw new Error('Failed to load db.json');
  }
  const data = await response.json();
  return data.books ?? [];
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  getReservations,
  approveReservation,
  denyReservation,
  getBorrowRules,
  saveBorrowRules,
  getAllUsers,
  updateUserRole,
  lockUserAccount,
  unlockUserAccount,
  getAdminDashboard,
  getUsers,
  getBooks,
};
