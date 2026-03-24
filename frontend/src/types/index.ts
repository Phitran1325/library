

export interface Author {
  _id: string;
  name: string;
  nationality: string;
  id: string;
}

export interface Publisher {
  _id: string;
  name: string;
  id: string;
}

export interface DigitalFile {
  _id: string;
  format: 'PDF' | 'EPUB' | string;
  url: string;
  publicId?: string;
  size?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

// ============================================
// BOOK TYPES (Updated to match API)
// ============================================

export interface Book {
  _id: string;
  id: string;
  title: string;
  slug?: string; // ✅ Add slug field
  isbn: string;
  description?: string;
  pages: number;
  publicationYear: number;
  publishedDate?: string;
  language: string;
  category: string;
  categoryId?: string;
  isAvailable: boolean;
  publishYear: string;
  // Nested objects từ API
  authorId: Author;
  publisherId: Publisher;

  // Pricing
  price: number;
  rentalPrice: number;
  discount: number;

  // Stock
  stock: number;
  available: number;
  totalCopies: number;
  availableCopies?: number;
  isAvailiable?: boolean;
  borrowCount?: number;
  // Optional fields
  volume?: number;

  // Flags
  isNewRelease: boolean;
  isPremium: boolean;
  isActive: boolean;

  // Arrays
  tags: string[];

  // Rating
  rating: number;
  reviewCount: number;

  // Status
  status: 'available' | 'unavailable' | 'coming_soon';

  // Timestamps - ALWAYS defined in API response
  createdAt: string;
  updatedAt: string;

  __v: number;

  // Digital files
  digitalFiles?: DigitalFile[]; // Array of ebook URLs

  // Computed/Display fields (optional - cho UI)
  image?: string; // Nếu cần thêm URL ảnh
  coverImage: string;
  author?: string; // Shortcut cho authorId.name
  publisher?: string; // Shortcut cho publisherId.name
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface BooksData {
  books: Book[];
  pagination: Pagination;
}

// ============================================
// BANNER TYPES
// ============================================

export interface Banner {
  id: string;
  text: string;
  title?: string;
  imageUrl?: string;
  link?: string;
  active?: boolean;
  order?: number;
  startDate?: string;
  endDate?: string;
  type?: 'main' | 'side' | 'popup';
}

// ============================================
// USER & AUTH TYPES
// ============================================

// Role - 4 roles in the system (using const object instead of enum)
export const Role = {
  GUEST: 'guest',
  READER: 'reader',
  LIBRARIAN: 'Librarian',
  ADMIN: 'admin',
} as const;

export type Role = typeof Role[keyof typeof Role];

// Permission - Fine-grained permissions (using const object instead of enum)
export const Permission = {
  // Guest permissions
  VIEW_BOOKS: 'view_books',

  // Reader permissions
  BORROW_BOOKS: 'borrow_books',
  PURCHASE_BOOKS: 'purchase_books',
  REVIEW_BOOKS: 'review_books',
  VIEW_PROFILE: 'view_profile',
  EDIT_PROFILE: 'edit_profile',
  VIEW_ORDERS: 'view_orders',

  // Librarian permissions
  MANAGE_BOOKS: 'manage_books',
  MANAGE_BORROWS: 'manage_borrows',
  MANAGE_RETURNS: 'manage_returns',
  VIEW_CUSTOMERS: 'view_customers',
  MANAGE_INVENTORY: 'manage_inventory',

  // Admin permissions
  MANAGE_STAFF: 'manage_staff',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_REPORTS: 'view_reports',
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

// Role to Permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.GUEST]: [
    Permission.VIEW_BOOKS,
  ],
  [Role.READER]: [
    Permission.VIEW_BOOKS,
    Permission.BORROW_BOOKS,
    Permission.PURCHASE_BOOKS,
    Permission.REVIEW_BOOKS,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_ORDERS,
  ],
  [Role.LIBRARIAN]: [
    // All Reader permissions
    Permission.VIEW_BOOKS,
    Permission.BORROW_BOOKS,
    Permission.PURCHASE_BOOKS,
    Permission.REVIEW_BOOKS,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_ORDERS,
    // Librarian-specific permissions
    Permission.MANAGE_BOOKS,
    Permission.MANAGE_BORROWS,
    Permission.MANAGE_RETURNS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_INVENTORY,
  ],
  [Role.ADMIN]: [
    // All permissions (full access)
    Permission.VIEW_BOOKS,
    Permission.BORROW_BOOKS,
    Permission.PURCHASE_BOOKS,
    Permission.REVIEW_BOOKS,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_ORDERS,
    Permission.MANAGE_BOOKS,
    Permission.MANAGE_BORROWS,
    Permission.MANAGE_RETURNS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_STAFF,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_REPORTS,
  ],
};

export interface User {
  _id: string;
  id?: string;

  email: string;
  username: string;
  fullName: string;
  role: "Reader" | "Librarian" | "Admin";

  passwordHash?: string;

  avatar?: string;
  phoneNumber?: string;
  address?: string;

  totalSpent: number;
  debt: number;
  canBorrow: boolean;
  status: string;
  isActive: boolean;
  violationCount: number;

  membershipPlanId?: string | null;
  membershipStartDate?: string;
  membershipEndDate?: string;

  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  debtLastUpdated?: string;

  notificationPreferences?: Record<string, boolean | string | number>;
  suspendedUntil?: string;
  suspensionReason?: string | null;

  __v?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: Role;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: Role | Role[]) => boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format giá tiền VND
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Tính giá sau giảm giá
 */
export const calculateDiscountedPrice = (price: number, discount: number): number => {
  return price - (price * discount / 100);
};

/**
 * Format ngày tháng
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Chưa xác định';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Ngày không hợp lệ';

  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Safe sort by rating - handle undefined
 */
export const sortByRating = (a: Book, b: Book): number => {
  const ratingA = a.rating ?? 0;
  const ratingB = b.rating ?? 0;
  return ratingB - ratingA;
};

/**
 * Safe sort by date - handle string dates
 */
export const sortByDate = (a: Book, b: Book, descending = true): number => {
  const dateA = new Date(a.createdAt || 0).getTime();
  const dateB = new Date(b.createdAt || 0).getTime();
  return descending ? dateB - dateA : dateA - dateB;
};

/**
 * Get author name from book
 */
export const getAuthorName = (book: Book): string => {
  return book.authorId?.name || 'Unknown Author';
};

/**
 * Get publisher name from book
 */
export const getPublisherName = (book: Book): string => {
  return book.publisherId?.name || 'Unknown Publisher';
};

/**
 * Check if book is available
 */
export const isBookAvailable = (book: Book): boolean => {
  return book.status === 'available' && (book.availableCopies ?? 0) > 0; // để khi bị undefined thì luôn được trả về 0
};
// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
}

// ============================================
// FILTER TYPES
// ============================================

export interface BookFilters {
  category?: string;
  search?: string;
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

// ============================================
// REVIEW TYPES
// ============================================

export interface Review {
  id: string;
    user: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  bookId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  images?: string[];
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    limit: number;
  };
}
export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  ratingPercentages: { [key: number]: number };
}
// ============================================
// CART TYPES
// ============================================

export interface CartItem {
  id: string;
  bookId: string;
  book: Book;
  quantity: number;
  addedAt?: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  discount?: number;
  shippingFee?: number;
  finalPrice: number;
}

// ============================================
// ORDER TYPES
// ============================================

export interface Order {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookImage?: string;
  quantity: number;
  price: string | number;
  totalPrice: string | number;
  status: 'processing' | 'completed' | 'cancelled' | 'pending' | 'shipped' | 'delivered';
  paymentMethod?: 'cash' | 'card' | 'momo' | 'bank_transfer';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  shippingAddress?: string;
  shippingFee?: number;
  discount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}
//============================================
// UPDATED BORROW TYPES - Support Rental Flow
// ============================================

export interface Borrow {

  _id: string;
  id?: string;
  notes: string;
  totalFee?: number;       
  user: {
    _id: string;
    email: string;
    fullName: string;
  };
  book: {
    _id: string;
    id?: string;
    title: string;
    isbn: string;
    category: string;
    authorId: string;
    image?: string;
    coverImage?: string;
    description?: string;
    pages?: number;
    publicationYear?: number;
    language?: string;
    publisherId?: string;
    price?: number;
    rentalPrice?: number;
    discount?: number;
    stock?: number;
    available?: number;
    totalCopies?: number;
    availableCopies?: number;
    isNewRelease?: boolean;
    isPremium?: boolean;
    tags?: string[];
    rating?: number;
    reviewCount?: number;
    status?: string;
    isActive?: boolean;
  };
  // Rental flow fields
  borrowType: 'Membership' | 'Rental';
  rentalDays?: number;
  paymentId?: string;
  // Existing fields
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Pending' | 'Borrowed' | 'Returned' | 'Overdue' | 'Cancelled' | 'Damaged' | 'Lost' | 'ReturnRequested' | 'Rejected';
  renewalCount: number;
  maxRenewals: number;
  lateFee?: number;
  damageFee?: number;
  daysLate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowsData {
  borrows: Borrow[];
  pagination: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================
// RENTAL PAYMENT TYPES
// ============================================

export interface RentalPaymentRequest {
  bookId: string;
  rentalDays: number;
}

export interface RentalPaymentResponse {
  success: boolean;
  data: {
    paymentLink: string;
    paymentId: string;
    amount: number;
    expiresAt: string;
  };
}

// ============================================
// BORROW REQUEST TYPES
// ============================================

export interface BorrowRequest {
  bookId: string;
  borrowType: 'Membership' | 'Rental';
  rentalDays?: number; // Required for Rental
  paymentId?: string; // Required for Rental
}

export interface BorrowResponse {
  success: boolean;
  message: string;
  data: {
    borrow: Borrow;
  };
}

// ============================================
// RESERVATION TYPES
// ============================================

export interface Reservation {
  _id: string;
  id?: string;
  user: string;
  book: Book;
  status: 'Pending' | 'Ready' | 'Assigned' | 'Completed' | 'Fulfilled' | 'Cancelled' | 'Expired' | 'Rejected';
  expiresAt: string;
  assignedAt?: string;
  fulfilledAt?: string;
  rejectionReason?: string;
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

// ============================================
// FAVORITE TYPES
// ============================================
export interface FavoriteBook {
  _id: string;
  user: string;
  book: {
    _id: string;
    title: string;
    isbn: string;
    description: string;
    coverImage: string;
    pages: number;
    publicationYear: number;
    language: string;
    category: string;
    // ✅ FIX: authorId là object, không phải string
    authorId: {
      _id: string;
      name: string;
      id: string;
    };
    // ✅ FIX: publisherId là object, không phải string
    publisherId: {
      _id: string;
      name: string;
      id: string;
    };
    price: number;
    rentalPrice: number;
    discount: number;
    stock: number;
    available: number;
    isNewRelease: boolean;
    isPremium: boolean;
    tags: string[];
    rating: number;
    reviewCount: number;
    status: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    digitalFiles: DigitalFile[];
    totalCopies: number;
    availableCopies: number;
    id: string;
  };
  notifyOnAvailable: boolean;
  isWaitingAvailability: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
export interface AddFavoriteResponse {
  success: boolean;
  message: string;
  data: {
    favoriteBook: FavoriteBook;
  };
}

export interface RemoveFavoriteResponse {
  success: boolean;
  message: string;
}

export interface CheckFavoriteResponse {
  success: boolean;
  data: {
    isFavorite: boolean;
    favoriteId?: string;
  };
}


// ============================================
// NOTIFICATION TYPES
// ============================================

export interface NotificationItem {
  _id: string;
  user: string;
  type: 'favorite-available' | 'borrow-reminder' | 'reservation-ready' | 'membership-expiring';
  title: string;
  message: string;
  bookId?: string;
  status: 'unread' | 'read';
  createdAt: string;
  updatedAt: string;
}

// Keep existing interface for compatibility
export interface FavoriteBookNotification {
  _id: string;
  book: Book; 
  addedDate: string;
  isAvailable: boolean;
  previousStatus?: string;
}


// ============================================
// MEMBERSHIP PLAN TYPES
// ============================================

export interface MembershipPlan {
  _id: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  maxBorrows: number;
  maxConcurrentBorrows: number;
  maxBooks?: number; // ✅ ADDED: Alias for maxConcurrentBorrows
  maxBooksPerBorrow?: number; // ✅ ADDED: Alternative field name from backend
  discountRate: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlanResponse {
  success: boolean;
  data: {
    plan: MembershipPlan;
  };
  message?: string;
}

export interface MembershipPlansResponse {
  success: boolean;
  data: {
    plans: MembershipPlan[];
  };
  message?: string;
}

export interface UserMembership {
  _id: string;
  user: string;
  plan: MembershipPlan;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Cancelled' | 'Pending';
  borrowsUsed: number;
  currentBorrows: number;
  paymentId?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserMembershipResponse {
  success: boolean;
  data: {
    membership: UserMembership;
  };
  message?: string;
}

export interface MembershipStatusResponse {
  success: boolean;
  data: {
    hasMembership: boolean;
    membership?: UserMembership;
    canBorrow: boolean;
    borrowsRemaining: number;
  };
}

// ============================================
// DEBT PAYMENT TYPES
// ============================================

export interface DebtPayment {
  _id: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    debt: number;
  };
  amount: number;
  debtBefore: number;
  debtAfter: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
  processedBy?: {
    _id: string;
    fullName: string;
  } | string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type SortOrder = 'asc' | 'desc';
export type BookStatus = 'available' | 'unavailable' | 'coming_soon';
export type UserRole = 'user' | 'admin' | 'librarian' | 'reader';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'shipped' | 'delivered';

// Export tất cả 
export default {
  formatPrice,
  calculateDiscountedPrice,
  formatDate,
  sortByRating,
  sortByDate,
  getAuthorName,
  getPublisherName,
  isBookAvailable,
};

// ============================================
// EBOOK ACCESS TYPES
// ============================================

export interface EbookAccess {
  _id: string;
  user: User;
  book: Book;
  accessLevel: 'full' | 'preview';
  status?: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
