import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Book } from '../../types';
import { favoriteService, reservationService, reviewService } from '../../services/book.service';
import {
    BookImage,
    BookInfo,
    ActionPanel,
    TabNavigation,
    DetailsTab,
    ReviewsTab,
    RelatedTab,
    Breadcrumb,
    EbookActions,
    type TabType,
} from '../../components/BookDetail';
import { getBookImage } from '@/utils/book';
import useNotification from '../../hooks/userNotification';
import BorrowBookModal from '@/components/BookDetail/BorrowBookModal';
import ReservationCreateModal from '@/components/common/book/ReservationCreateModal';


const API_BASE_URL = 'http://localhost:5000/api';

const BookDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { showSuccess, showError } = useNotification();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const [showReserveModal, setShowReserveModal] = useState(false);
    // Related books
    const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);

    // ✅ UPDATED: Reviews state with pagination
    type Review = {
        id: string;
        bookId: string;
        userName: string;
        userId?: string;
        rating: number;
        comment: string;
        date: string;
        helpful: number;
        userAvatar?: string;
        images?: string[];
    };

    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewPagination, setReviewPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalReviews: 0
    });
    const [reviewSortBy, setReviewSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');

    // ✅ UPDATED: Calculate rating stats from current reviews
    const ratingStats = useMemo(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reviewService.calculateRatingStats(reviews as any),
        [reviews]
    );

    // Right panel state
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    // Check favorite status when book loads
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!book) return;

            // Use book._id or book.id instead of URL param (which might be slug)
            const bookId = book._id || book.id;
            if (!bookId) return;

            const token = localStorage.getItem('token');
            if (!token) {
                setIsFavorite(false);
                return;
            }

            try {
                const isFav = await favoriteService.isFavorite(bookId);
                setIsFavorite(isFav);
            } catch (error) {
                console.error('Error checking favorite status:', error);
                setIsFavorite(false);
            }
        };

        if (book) {
            checkFavoriteStatus();
        }
    }, [book]);

    // ✅ NEW: Fetch reviews with pagination when page/sort changes
    useEffect(() => {
        const fetchReviews = async () => {
            if (!id) return;

            try {
                setReviewsLoading(true);

                const data = await reviewService.getReviews(
                    id,
                    reviewPagination.currentPage,
                    5, // 5 reviews per page
                    reviewSortBy
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setReviews(data.reviews as any);
                setReviewPagination({
                    currentPage: data.pagination.currentPage,
                    totalPages: data.pagination.totalPages,
                    totalReviews: data.pagination.totalReviews
                });
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setReviews([]);
                setReviewPagination({
                    currentPage: 1,
                    totalPages: 1,
                    totalReviews: 0
                });
            } finally {
                setReviewsLoading(false);
            }
        };

        fetchReviews();
    }, [id, reviewPagination.currentPage, reviewSortBy]);

    // Fetch book data
    useEffect(() => {
        const fetchBook = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`${API_BASE_URL}/books/${id}`, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const json = await res.json();
                const data = json?.data?.book;
                if (!data) {
                    throw new Error('Không tìm thấy dữ liệu sách');
                }

                // Map to Book type
                setBook({
                    id: data.id || data._id,
                    _id: data._id,
                    title: data.title,
                    isbn: data.isbn,
                    description: data.description,
                    pages: data.pages,
                    publicationYear: data.publicationYear,
                    language: data.language,
                    category: data.category,
                    authorId: data.authorId,
                    publisherId: data.publisherId,
                    price: data.price,
                    rentalPrice: data.rentalPrice,
                    discount: data.discount,
                    stock: data.stock,
                    available: data.available,
                    isNewRelease: data.isNewRelease,
                    isPremium: data.isPremium,
                    tags: data.tags,
                    rating: data.rating,
                    reviewCount: data.reviewCount,
                    status: data.status,
                    isActive: data.isActive,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    totalCopies: data.totalCopies,
                    availableCopies: data.availableCopies,
                    image: data.image,
                    coverImage: data.coverImage,
                    digitalFiles: data.digitalFiles
                } as Book);

                // ❌ REMOVED: Old reviews fetch logic - now using separate useEffect with pagination

                // Fetch related books by category
                try {
                    const category = data.category;
                    if (category) {
                        const resRel = await fetch(`${API_BASE_URL}/books?category=${encodeURIComponent(category)}&limit=8`, {
                            headers: { 'Content-Type': 'application/json' }
                        });
                        if (resRel.ok) {
                            const jr = await resRel.json();
                            const books: Array<{
                                id?: string;
                                _id?: string;
                                slug?: string;
                                title: string;
                                image?: string;
                                coverImage?: string;
                                category?: string;
                                status?: string;
                                availableCopies?: number;
                                available?: number;
                            }> = jr?.data?.books ?? [];
                            setRelatedBooks(books
                                .filter((b) => (b.id || b._id) !== (data.id || data._id))
                                .map((b) => ({
                                    id: b.id || b._id || '',
                                    _id: b._id,
                                    slug: b.slug,
                                    title: b.title,
                                    image: b.image ?? b.coverImage,
                                    category: b.category,
                                    isAvailable: b.status === 'available' && ((b.availableCopies ?? b.available ?? 0) > 0)
                                })) as unknown as Book[]);
                        } else {
                            setRelatedBooks([]);
                        }
                    } else {
                        setRelatedBooks([]);
                    }
                } catch {
                    setRelatedBooks([]);
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    // Handlers for display-only interactions
    const incrementQuantity = () => setQuantity((q) => q + 1);
    const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));
    const [showBorrowModal, setShowBorrowModal] = useState(false);

    // Handle borrow button click
    const handleBorrowClick = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showError('Vui lòng đăng nhập để mượn sách');
            window.location.href = '/login';
            return;
        }
        setShowBorrowModal(true);
    };

    const handleBorrowError = (message: string, errors?: string[]) => {
        if (errors && errors.length > 0) {
            const title = errors.join(' • ');
            showError(message, title);
        } else {
            showError(message, 'Lỗi');
        }
    };

    // Handle borrow success
    const handleBorrowSuccess = async () => {
        showSuccess('Mượn sách thành công!');
        setShowBorrowModal(false);

        // Refresh book data to update available copies
        if (id) {
            try {
                const res = await fetch(`${API_BASE_URL}/books/${id}`, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    const json = await res.json();
                    const data = json?.data?.book;
                    if (data) {
                        setBook(prev => prev ? {
                            ...prev,
                            availableCopies: data.availableCopies,
                            available: data.available,
                            status: data.status
                        } : null);
                    }
                }
            } catch (err) {
                console.error('Error refreshing book data:', err);
            }
        }
    };



    // Update handleReserve to show modal first
    const handleReserveClick = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showError('Vui lòng đăng nhập để đặt trước sách');
            window.location.href = '/login';
            return;
        }
        setShowReserveModal(true);
    };

    const handleConfirmReserve = async () => {
        if (!book?.id) {
            showError('Không tìm thấy thông tin sách');
            return;
        }

        try {
            setActionLoading(true);
            const reservation = await reservationService.createReservation(book.id);

            // Format expiry date
            const expiryDate = new Date(reservation.expiresAt);
            const expiryDateStr = expiryDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            showSuccess(
                `Đặt trước sách thành công!\n` +
                `Mã đặt trước: ${reservation._id}\n` +
                `Vị trí hàng đợi: ${reservation.queuePosition}\n` +
                `Hạn nhận sách: ${expiryDateStr}`
            );
            setShowReserveModal(false);

            // Refresh book data
            if (id) {
                try {
                    const res = await fetch(`${API_BASE_URL}/books/${id}`, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (res.ok) {
                        const json = await res.json();
                        const data = json?.data?.book;
                        if (data) {
                            setBook(prev => prev ? {
                                ...prev,
                                availableCopies: data.availableCopies,
                                available: data.available,
                                status: data.status
                            } : null);
                        }
                    }
                } catch (err) {
                    console.error('Error refreshing book data:', err);
                }
            }
        } catch (error) {
            console.error('Reserve error:', error);

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { message?: string; error?: string };
                        status?: number
                    };
                    message?: string;
                };

                const status = axiosError.response?.status;
                const errorMsg = axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message;

                switch (status) {
                    case 500:
                        // Handle specific business logic errors
                        if (errorMsg?.includes('mượn cuốn sách này')) {
                            showError('Bạn đang mượn cuốn sách này, không thể đặt trước!');
                        } else {
                            showError(errorMsg || 'Đặt trước sách thất bại');
                        }
                        break;
                    case 409:
                        showError(`Bạn đã có đơn đặt trước cho cuốn sách này rồi!`);
                        break;
                    case 401:
                        showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                        break;
                    case 404:
                        showError('Không tìm thấy sách');
                        break;
                    case 400:
                        showError(errorMsg || `Dữ liệu không hợp lệ`);
                        break;
                    default:
                        showError(errorMsg || `Đặt trước sách thất bại`);
                }
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Đặt trước sách thất bại';
                showError(errorMessage);
            }
        } finally {
            setActionLoading(false);
        }
    }; const handleToggleFavorite = async () => {
        const bookId = book?._id || book?.id;
        if (!bookId) {
            showError('Không tìm thấy thông tin sách');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showError('Vui lòng đăng nhập để thêm vào yêu thích');
            window.location.href = '/login';
            return;
        }

        try {
            setFavoriteLoading(true);
            const result = await favoriteService.toggleFavorite(bookId);
            setIsFavorite(result.isFavorite);
            showSuccess(result.message);
        } catch (error) {
            console.error('Toggle favorite error:', error);

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as {
                    response?: {
                        data?: { message?: string };
                        status?: number
                    };
                    message?: string;
                };

                const status = axiosError.response?.status;
                // const message = axiosError.response?.data?.message || axiosError.message;

                switch (status) {
                    case 401:
                        showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                        break;
                    case 404:
                        showError('Không tìm thấy sách');
                        break;
                    case 400:
                        showError(`Dữ liệu không hợp lệ`);
                        break;
                    default:
                        showError(`Thao tác thất bại`);
                }
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Thao tác thất bại';
                showError(`❌ ${errorMessage}`);
            }
        } finally {
            setFavoriteLoading(false);
        }
    };

    // ✅ UPDATED: Handle review page change
    const handleReviewPageChange = (page: number) => {
        setReviewPagination(prev => ({
            ...prev,
            currentPage: page
        }));
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ✅ UPDATED: Handle sort change
    const handleReviewSortChange = (sortBy: 'newest' | 'oldest' | 'rating') => {
        setReviewSortBy(sortBy);
        // Reset to page 1 when sorting changes
        setReviewPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-light">Đang tải thông tin sách...</p>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-error text-lg mb-4">{error || 'Không tìm thấy sách'}</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto px-4 py-8">
                <Breadcrumb bookTitle={book.title} />

                {/* Book Main Info */}
                <div className="grid lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-1">
                        <BookImage
                            src={getBookImage(book)}
                            alt={book.title}
                            className="sticky top-24"
                        />
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <BookInfo
                            book={{
                                ...book,
                                author: book.authorId?.name,
                                publisher: book.publisherId?.name,
                                publishYear: book.publicationYear,
                                isAvailable: book.status === 'available' && (book.availableCopies || book.available || 0) > 0
                            } as unknown as Book}
                        />

                        {book.digitalFiles && book.digitalFiles.length > 0 && (
                            <div className="bg-white border border-border rounded-lg shadow-sm p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Phiên bản ebook</p>
                                        <p className="text-xs text-gray-500">Đọc online hoặc tải xuống ngay</p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {book.digitalFiles.length} file{book.digitalFiles.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <EbookActions book={book} />
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <ActionPanel
                            book={book}
                            quantity={quantity}
                            isFavorite={isFavorite}
                            onQuantityChange={setQuantity}
                            onIncrement={incrementQuantity}
                            onDecrement={decrementQuantity}
                            onBorrowClick={handleBorrowClick}
                            onReserve={handleReserveClick}
                            onToggleFavorite={handleToggleFavorite}
                            actionLoading={actionLoading}
                            favoriteLoading={favoriteLoading}
                        />
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <TabNavigation
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    <div className="mt-6">
                        {activeTab === 'details' && (
                            <DetailsTab
                                book={{
                                    ...book,
                                    author: book.authorId?.name,
                                    publisher: book.publisherId?.name,
                                    isAvailable: book.status === 'available' && (book.availableCopies || book.available || 0) > 0
                                } as unknown as Book}
                            />
                        )}

                        {/* ✅ UPDATED: Reviews Tab with pagination */}
                        {activeTab === 'reviews' && (
                            <ReviewsTab
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                reviews={reviews as any}
                                ratingStats={ratingStats}
                                pagination={reviewPagination}
                                loading={reviewsLoading}
                                onPageChange={handleReviewPageChange}
                                onSortChange={handleReviewSortChange}
                            />
                        )}

                        {activeTab === 'related' && (
                            <RelatedTab relatedBooks={relatedBooks} />
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            {book && (
                <>
                    <BorrowBookModal
                        book={book}
                        isOpen={showBorrowModal}
                        onClose={() => setShowBorrowModal(false)}
                        onSuccess={handleBorrowSuccess}
                        onError={handleBorrowError}
                    />

                    {/* ✅ NEW: Reserve Modal */}
                    <ReservationCreateModal
                        book={book}
                        isOpen={showReserveModal}
                        onClose={() => setShowReserveModal(false)}
                        onConfirm={handleConfirmReserve}
                        isLoading={actionLoading}
                    />
                </>
            )}
        </div>
    );
};

export default BookDetail;