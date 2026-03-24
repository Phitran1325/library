import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatPrice, type FavoriteBook } from '../../types';
import { LuNotebookPen, LuHeart, LuCalendar, LuTag, LuTrash2 } from "react-icons/lu";

import { favoriteService } from '../../services/book.service';
import useNotification from '@/hooks/userNotification';
import { Star, Tag } from 'lucide-react';

const MyFavorites = () => {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showSuccess, showError } = useNotification();

    const itemsPerPage = 10;

    // Fetch favorites
    useEffect(() => {
        fetchFavorites();
    }, [currentPage]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await favoriteService.getFavoriteBooks(currentPage, itemsPerPage);

            setFavorites(data.favoriteBooks);
            setTotalPages(data.pagination.totalPages);
            setTotalCount(data.pagination.total);
        } catch (err) {
            console.error('Error fetching favorites:', err);
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách yêu thích');
        } finally {
            setLoading(false);
        }
    };

    // Handle remove from favorites
    const handleRemoveFavorite = async (bookId: string, bookTitle: string) => {
        if (!confirm(`Bạn có chắc muốn xóa "${bookTitle}" khỏi danh sách yêu thích?`)) {
            return;
        }

        try {
            setActionLoading(bookId);
            await favoriteService.removeFromFavorites(bookId);
            showSuccess('Đã xóa khỏi danh sách yêu thích');

            // Refresh list
            await fetchFavorites();
        } catch (err) {
            console.error('Error removing favorite:', err);
            showError(err instanceof Error ? err.message : 'Không thể xóa sách khỏi yêu thích');
        } finally {
            setActionLoading(null);
        }
    };

    // Get availability badge
    const getAvailabilityBadge = (book: FavoriteBook['book']) => {
        const isAvailable = book.status === 'available' && (book.availableCopies || book.available) > 0;

        if (isAvailable) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Còn sách ({book.availableCopies || book.available} cuốn)
                </span>
            );
        } else {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ✗ Hết sách
                </span>
            );
        }
    };
    const getAuthorName = (authorId: FavoriteBook['book']['authorId']): string => {
        // Type guard để TypeScript hiểu đây là object có property 'name'
        if (typeof authorId === 'object' && authorId !== null && 'name' in authorId && authorId.name) {
            return authorId.name;
        }
        return 'Không rõ tác giả';
    };
    // Get book badges (new release, premium)
    const getBookBadges = (book: FavoriteBook['book']) => {
        const badges = [];

        if (book.isNewRelease) {
            badges.push(
                <span key="new" className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🆕 Mới phát hành
                </span>
            );
        }

        if (book.isPremium) {
            badges.push(
                <span key="premium" className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                    <Star size={14} className="fill-purple-800" /> Premium
                </span>
            );
        }

        if (book.discount > 0) {
            badges.push(
                <span key="discount" className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                    <Tag size={14} /> Giảm {book.discount}%
                </span>
            );
        }

        return badges;
    };

    // Loading state
    if (loading && favorites.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <LuHeart className="text-red-500" />
                        Sách Yêu Thích
                    </h1>
                    <p className="text-gray-600">
                        Quản lý danh sách sách yêu thích của bạn
                        {totalCount > 0 && (
                            <span className="ml-2 text-primary font-medium">
                                ({totalCount} cuốn)
                            </span>
                        )}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Favorites List */}
                {favorites.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">💝</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Chưa có sách yêu thích
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Bạn chưa thêm sách nào vào danh sách yêu thích. Hãy khám phá thư viện và thêm những cuốn sách bạn yêu thích!
                        </p>
                        <button
                            onClick={() => navigate('/books')}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            Khám phá thư viện
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {favorites.map((favorite) => {
                            const book = favorite.book;
                            const isAvailable = book.status === 'available' && (book.availableCopies || book.available) > 0;

                            return (
                                <div
                                    key={favorite._id}
                                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                                >
                                    <div className="flex gap-6">
                                        {/* Book Image */}
                                        <div className="shrink-0">
                                            <div
                                                onClick={() => navigate(`/books/${book._id || book.id}`)}
                                                className="w-32 h-44 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative"
                                            >
                                                {book.coverImage ? (
                                                    <img
                                                        src={book.coverImage}
                                                        alt={book.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                        <LuNotebookPen className="text-4xl text-gray-400" />
                                                    </div>
                                                )}
                                                {/* Favorite indicator overlay */}
                                                <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg">
                                                    <LuHeart className="text-sm fill-current" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Book Info */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3
                                                    onClick={() => navigate(`/books/${book._id || book.id}`)}
                                                    className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-primary transition-colors flex-1 pr-4"
                                                >
                                                    {book.title}
                                                </h3>

                                                {/* Remove button */}
                                                <button
                                                    onClick={() => handleRemoveFavorite(book._id || book.id, book.title)}
                                                    disabled={actionLoading === (book._id || book.id)}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                                                    title="Xóa khỏi yêu thích"
                                                >
                                                    <LuTrash2 className="text-base" />
                                                    {actionLoading === (book._id || book.id) ? 'Đang xử lý...' : 'Xóa'}
                                                </button>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-4">
                                                Tác giả: <span className="font-medium">{getAuthorName(book.authorId)}</span>
                                                {' • '}
                                                ISBN: {book.isbn}
                                                {' • '}
                                                {book.category}
                                            </p>

                                            {/* Badges: Availability, New Release, Premium, Discount */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {getAvailabilityBadge(book)}
                                                {getBookBadges(book)}
                                            </div>

                                            {/* Book Stats */}
                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <LuCalendar className="text-lg" />
                                                    <span>Năm xuất bản: {book.publicationYear}</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <LuNotebookPen className="text-lg" />
                                                    <span>{book.pages} trang • {book.language}</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <LuTag className="text-lg" />
                                                    <span>Giá mua: {formatPrice(book.price)}</span>
                                                </div>

                                                {book.rentalPrice > 0 && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <LuTag className="text-lg" />
                                                        <span>Giá thuê: {formatPrice(book.rentalPrice)}/ngày</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Favorite Date */}
                                            <div className="text-xs text-gray-500 mb-4">
                                                ❤️ Đã thích từ {formatDate(favorite.createdAt)}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                {/* View Details */}
                                                <button
                                                    onClick={() => navigate(`/books/${book._id || book.id}`)}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                                                >
                                                    Xem chi tiết
                                                </button>

                                                {/* Borrow button (if available) */}
                                                {isAvailable ? (
                                                    <button
                                                        onClick={() => navigate(`/books/${book._id || book.id}`)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                    >
                                                        Mượn sách
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                                                    >
                                                        Hết sách
                                                    </button>
                                                )}

                                                {/* Notify when available (if out of stock and user wants notification) */}
                                                {!isAvailable && favorite.notifyOnAvailable && (
                                                    <div className="flex items-center gap-2 text-sm text-blue-600 px-4 py-2 bg-blue-50 rounded-lg">
                                                        🔔 Đã bật thông báo khi có sách
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Trước
                        </button>

                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (currentPage <= 3) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-4 py-2 border rounded-lg transition-colors ${currentPage === page
                                        ? 'bg-primary text-white border-primary'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyFavorites;