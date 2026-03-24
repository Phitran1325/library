// constants/index.ts
//Các hằng số (routes, API endpoints, etc.)
export const APP_NAME = 'Lib71';

export const ROUTES = { 
  HOME: '/',
  BOOKS: '/books',
  CATEGORIES: '/categories',
  CART: '/cart',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
  BOOK_DETAIL: (id: number) => `/books/${id}`,
} as const;

export const API_ENDPOINTS = {
  BOOKS: '/api/books',
  BANNERS: '/api/banners',
  CATEGORIES: '/api/categories',
  USERS: '/api/users',
  CART: '/api/cart',
  ORDERS: '/api/orders',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
} as const;

export const BOOK_CATEGORIES = [
  'Văn học',
  'Light Novel',
  'Manga',
  'Kinh tế',
  'Tâm lý',
  'Kỹ năng sống',
  'Thiếu nhi',
  'Giáo khoa',
] as const;

export const CURRENCY = 'Đ';

export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';