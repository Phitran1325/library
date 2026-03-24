import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatPrice } from '../../types';
import type { Borrow } from '../../types';
import { borrowService, reviewService } from '../../services/book.service';
import useNotification from '@/hooks/userNotification';
import ReviewModal from '@/components/common/book/ReviewModal';
import { Star, TriangleAlert, CheckCircle, Clock, AlertCircle, Hourglass, Package } from 'lucide-react';
import { LuNotebookPen, LuClock, LuCalendar, LuTag, LuDollarSign, LuFileText } from "react-icons/lu";

const MyBorrows = () => {
    const navigate = useNavigate();
    const [borrows, setBorrows] = useState<Borrow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'borrowed' | 'returned'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showSuccess, showError, showInfo } = useNotification();
    //Review modal state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBookForReview, setSelectedBookForReview] = useState<typeof borrows[0] | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    const itemsPerPage = 10;

    // Fetch borrows
    useEffect(() => {
        fetchBorrows();
    }, [currentPage]);

    const fetchBorrows = async () => {
        try {
            console.log('🎬 [MyBorrows] Fetching borrows...', { currentPage, itemsPerPage });

            setLoading(true);
            setError(null);

            const data = await borrowService.getMyBorrows(currentPage, itemsPerPage);

            console.log('📥 [MyBorrows] Received data from service:', {
                borrowsCount: data.borrows.length,
                pagination: data.pagination,
            });

            // ✅ Filter out borrows with null book
            const validBorrows = data.borrows.filter(b => b.book !== null);

            console.log('✅ [MyBorrows] Valid borrows after filtering:', {
                total: data.borrows.length,
                valid: validBorrows.length,
                filtered: data.borrows.length - validBorrows.length,
            });

            // ✅ LOG EACH BORROW FOR UI
            validBorrows.forEach((borrow, index) => {
                console.log(`📋 [MyBorrows] Borrow #${index + 1} for UI:`, {
                    id: borrow._id || borrow.id,
                    status: borrow.status,
                    borrowType: borrow.borrowType,
                    book: {
                        id: borrow.book._id || borrow.book.id,
                        title: borrow.book.title,
                        hasImage: !!(borrow.book.image || borrow.book.coverImage),
                    },
                    dates: {
                        borrow: borrow.borrowDate,
                        due: borrow.dueDate,
                        return: borrow.returnDate,
                    },
                    rental: {
                        days: borrow.rentalDays,
                        paymentId: borrow.paymentId,
                    },
                    damage: {
                        notes: borrow.notes,
                        fee: borrow.damageFee,
                    },
                    renewal: {
                        count: borrow.renewalCount,
                        max: borrow.maxRenewals,
                    },
                });
            });

            setBorrows(validBorrows);
            setTotalPages(data.pagination.pages);

            console.log('✅ [MyBorrows] State updated successfully');
        } catch (err) {
            console.error('❌ [MyBorrows] Error fetching borrows:', err);
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách sách mượn');
        } finally {
            setLoading(false);
        }
    };

    // ✅ LOG FILTERED BORROWS
    const filteredBorrows = useMemo(() => {
        console.log('🔄 [MyBorrows] Filtering borrows by tab:', activeTab);

        let result: Borrow[] = [];

        if (activeTab === 'all') {
            result = borrows;
        } else if (activeTab === 'borrowed') {
            result = borrows.filter(b => b.status === 'Borrowed');
        } else if (activeTab === 'returned') {
            result = borrows.filter(b =>
                b.status === 'Returned' ||
                b.status === 'Damaged' ||
                b.status === 'Lost' ||
                b.returnDate
            );
        }

        console.log('📊 [MyBorrows] Filtered result:', {
            activeTab,
            totalBorrows: borrows.length,
            filteredCount: result.length,
        });

        return result;
    }, [borrows, activeTab]);


    // ✅ LOG BORROW COUNTS
    const borrowCounts = useMemo(() => {
        const counts = {
            all: borrows.length,
            borrowed: borrows.filter(b => b.status === 'Borrowed').length,
            returned: borrows.filter(b =>
                b.status === 'Returned' ||
                b.status === 'Damaged' ||
                b.status === 'Lost' ||
                b.returnDate
            ).length,
        };

        console.log('🔢 [MyBorrows] Borrow counts:', counts);

        return counts;
    }, [borrows]);

    const handleReviewClick = (borrow: typeof borrows[0]) => {
        setSelectedBookForReview(borrow);
        setShowReviewModal(true);
    };
    //Handle review submit
    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!selectedBookForReview?.book?.id && !selectedBookForReview?.book?._id) {
            showError('Không tìm thấy thông tin sách');
            return;
        }

        try {
            setReviewLoading(true);
            const bookId = selectedBookForReview.book.id || selectedBookForReview.book._id;

            await reviewService.submitReview(bookId, rating, comment);

            showSuccess('Đánh giá thành công! Cảm ơn bạn đã chia sẻ.');
            setShowReviewModal(false);
            setSelectedBookForReview(null);
        } catch (err) {
            console.error('Review error:', err);
            showError(err instanceof Error ? err.message : 'Không thể gửi đánh giá');
        } finally {
            setReviewLoading(false);
        }
    };

    // Handle renew
    const handleRenew = async (borrowId: string) => {
        const borrow = borrows.find(b => b._id === borrowId);
        if (!borrow) return;

        // Check if can renew by type (Rental cannot renew)
        if (!borrowService.canRenewByType(borrow)) {
            showInfo(borrowService.getRenewButtonText(borrow));
            return;
        }

        try {
            setActionLoading(borrowId);
            await borrowService.renewBorrow(borrowId);
            showSuccess('Gia hạn thành công!');
            await fetchBorrows();
        } catch (err) {
            console.error('Error renewing borrow:', err);
            showError(err instanceof Error ? err.message : 'Không thể gia hạn sách');
        } finally {
            setActionLoading(null);
        }
    };

    // Get borrow type badge
    const getBorrowTypeBadge = (borrow: Borrow) => {
        if (!borrow.borrowType) return null;

        const badgeClass = borrowService.getBorrowTypeBadgeClass(borrow.borrowType);
        const badgeText = borrowService.getBorrowTypeText(borrow.borrowType);

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                {badgeText}
            </span>
        );
    };

    // ✅ Get status badge - UPDATED to handle all statuses
    const getStatusBadge = (borrow: Borrow) => {
        const statusConfig: Record<Borrow['status'], { label: string; className: string }> = {
            'Pending': { label: 'Chờ xác nhận', className: 'bg-yellow-100 text-yellow-800' },
            'Borrowed': { label: 'Đang mượn', className: 'bg-blue-100 text-blue-800' },
            'Returned': { label: 'Đã trả', className: 'bg-green-100 text-green-800' },
            'Overdue': { label: 'Quá hạn', className: 'bg-red-100 text-red-800' },
            'Damaged': { label: 'Hư hỏng', className: 'bg-orange-100 text-orange-800' },
            'Lost': { label: 'Mất sách', className: 'bg-red-100 text-red-800' },
            'Cancelled': { label: 'Đã hủy', className: 'bg-gray-100 text-gray-800' },
            'ReturnRequested': { label: 'Chờ trả sách', className: 'bg-purple-100 text-purple-800' },
            'Rejected': { label: 'Từ chối', className: 'bg-red-100 text-red-800' }
        };

        const config = statusConfig[borrow.status];

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
                {config.label}
            </span>
        );
    };

    // Get days remaining badge
    const getDaysRemainingBadge = (borrow: Borrow) => {
        // ✅ Chỉ hiển thị cho status 'Borrowed'
        if (borrow.status !== 'Borrowed') return null;

        const statusInfo = borrowService.getBorrowStatus(borrow.dueDate);

        const badgeConfig = {
            'overdue': { className: 'bg-red-100 text-red-800', IconComponent: AlertCircle },
            'due-soon': { className: 'bg-yellow-100 text-yellow-800', IconComponent: Clock },
            'on-time': { className: 'bg-green-100 text-green-800', IconComponent: CheckCircle },
            'pending': { className: 'bg-gray-100 text-gray-800', IconComponent: Hourglass },
        } as const;

        const config = badgeConfig[statusInfo.status];
        const Icon = config.IconComponent;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${config.className}`}>
                <Icon size={14} /> {statusInfo.message}
            </span>
        );
    };

    // Get rental info section
    const getRentalInfo = (borrow: Borrow) => {
        if (borrow.borrowType !== 'Rental' || !borrow.rentalDays) return null;

        return (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-medium text-blue-900 mb-1 flex items-center gap-1">
                    <Package size={16} className="text-blue-700" />
                    Thông tin mượn lẻ:
                </div>
                <div className="text-blue-700">
                    Số ngày thuê: <span className="font-semibold">{borrow.rentalDays} ngày</span>
                </div>
                {borrow.paymentId && (
                    <div className="text-blue-700 mt-1">
                        Mã thanh toán: <span className="font-mono text-xs">{borrow.paymentId}</span>
                    </div>
                )}
            </div>
        );
    };

    // ✅ NEW: Get late fee info
    const getLateFeeInfo = (borrow: Borrow) => {
        // Chỉ hiển thị nếu có phí trễ hạn
        if (!borrow.lateFee || borrow.lateFee <= 0) return null;

        // Tính số ngày trễ
        const dueDate = new Date(borrow.dueDate);
        const returnDate = borrow.returnDate ? new Date(borrow.returnDate) : new Date();
        const daysLate = Math.max(0, Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

        return (
            <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
                <div className="flex items-start gap-2 text-red-900 mb-3">
                    <TriangleAlert className="text-lg mt-0.5 flex-shrink-0 text-red-600" />
                    <div className="flex-1">
                        <span className="font-semibold">Phí phạt trễ hạn:</span>
                        <p className="mt-0.5">
                            Trả muộn <span className="font-bold">{daysLate} ngày</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-red-900 mb-3">
                    <LuDollarSign className="text-lg flex-shrink-0" />
                    <div>
                        <span className="font-semibold">Phí phạt:</span>
                        <span className="ml-2 font-bold text-red-700">
                            {formatPrice(borrow.lateFee)}
                        </span>
                    </div>
                </div>



                {/* Warning */}
                <div className="mt-3 pt-3 border-t border-red-300">
                    <div className="flex items-start gap-2 p-3 bg-red-100 rounded-md">
                        <TriangleAlert className="text-xl text-red-700 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-red-900 font-semibold mb-1">
                                Vui lòng thanh toán phí phạt
                            </p>
                            <p className="text-xs text-red-800 leading-relaxed">
                                Phí phạt cần được thanh toán trước khi mượn sách tiếp theo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ✅ UPDATE: getDamageInfo - Chỉ hiển thị damage fee
    const getDamageInfo = (borrow: Borrow) => {
        // Chỉ hiển thị nếu có notes hoặc damage fee
        if (!borrow.notes && (!borrow.damageFee || borrow.damageFee <= 0)) return null;

        return (
            <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm mb-3">
                {/* Notes */}
                {borrow.notes && (
                    <div className="flex items-start gap-2 text-orange-900 mb-3">
                        <LuFileText className="text-lg mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <span className="font-semibold">Ghi chú:</span>
                            <p className="mt-0.5">{borrow.notes}</p>
                        </div>
                    </div>
                )}

                {/* Damage fee ONLY */}
                {borrow.damageFee && borrow.damageFee > 0 && (
                    <div className="flex items-center gap-2 text-orange-900 mb-3">
                        <LuDollarSign className="text-lg flex-shrink-0" />
                        <div>
                            <span className="font-semibold">Phí hư hỏng:</span>
                            <span className="ml-2 font-bold text-orange-700">
                                {formatPrice(borrow.damageFee)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Warning for damaged books */}
                {borrow.status === 'Damaged' && (
                    <div className="mt-3 pt-3 border-t border-orange-300">
                        <div className="flex items-start gap-2 p-3 bg-orange-100 rounded-md">
                            <TriangleAlert className="text-xl text-orange-700 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-orange-900 font-semibold mb-1">
                                    Lưu ý về đánh giá
                                </p>
                                <p className="text-xs text-orange-800 leading-relaxed">
                                    Sách bị đánh dấu hư hỏng sẽ không thể đánh giá.
                                    Chỉ những sách được trả trong tình trạng tốt mới có thể đánh giá.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Loading state
    if (loading && borrows.length === 0) {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Sách Đã Mượn</h1>
                    <p className="text-gray-600">Quản lý sách bạn đã và đang mượn</p>
                </div>

                {/* Tabs - ✅ UPDATED with correct counts */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('all')}
                            className="relative px-6 py-4 text-sm font-medium transition-colors group"
                        >
                            <span className={activeTab === 'all' ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900'}>
                                Tất cả ({borrowCounts.all})
                            </span>
                            {activeTab === 'all' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('borrowed')}
                            className="relative px-6 py-4 text-sm font-medium transition-colors group"
                        >
                            <span className={activeTab === 'borrowed' ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900'}>
                                Đang mượn ({borrowCounts.borrowed})
                            </span>
                            {activeTab === 'borrowed' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('returned')}
                            className="relative px-6 py-4 text-sm font-medium transition-colors group"
                        >
                            <span className={activeTab === 'returned' ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900'}>
                                Đã trả ({borrowCounts.returned})
                            </span>
                            {activeTab === 'returned' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Borrows List */}
                {filteredBorrows.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {activeTab === 'all'
                                ? 'Chưa có sách nào được mượn'
                                : activeTab === 'borrowed'
                                    ? 'Không có sách đang mượn'
                                    : 'Không có sách đã trả'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {activeTab === 'all'
                                ? 'Bạn chưa mượn sách nào. Hãy khám phá thư viện và mượn sách ngay!'
                                : activeTab === 'borrowed'
                                    ? 'Bạn không có sách nào đang mượn.'
                                    : 'Bạn chưa trả sách nào.'}
                        </p>
                        {activeTab === 'all' && (
                            <button
                                onClick={() => navigate('/books')}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Khám phá thư viện
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 mb-2">
                        {filteredBorrows.map((borrow) => (
                            <div
                                key={borrow._id || borrow.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 mb-2"
                            >
                                <div className="flex gap-6">
                                    {/* Book Image */}
                                    <div className="shrink-0">
                                        <div
                                            onClick={() => navigate(`/books/${borrow.book._id}`)}
                                            className="w-32 h-44 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                        >
                                            {borrow.book.image || borrow.book.coverImage ? (
                                                <img
                                                    src={borrow.book.coverImage || borrow.book.image}
                                                    alt={borrow.book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <LuNotebookPen className="text-4xl text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Book Info */}
                                    <div className="flex-1">
                                        <h3
                                            onClick={() => navigate(`/books/${borrow.book.id || borrow.book._id}`)}
                                            className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary transition-colors"
                                        >
                                            {borrow.book.title}
                                        </h3>

                                        <p className="text-sm text-gray-600 mb-4">
                                            ISBN: {borrow.book.isbn} | {borrow.book.category}
                                        </p>

                                        {/* Badges: Status, Days Remaining, Borrow Type */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {getStatusBadge(borrow)}
                                            {getDaysRemainingBadge(borrow)}
                                            {getBorrowTypeBadge(borrow)}
                                        </div>

                                        {/* Rental Info (if applicable) */}
                                        {getRentalInfo(borrow)}

                                        {/* ✅ Damage Info (if applicable) - NEW */}
                                        {getDamageInfo(borrow)}
                                        {/* ✅ Late Fee Info (trễ hạn) - hiển thị SAU */}
                                        {getLateFeeInfo(borrow)}
                                        {/* Dates and Fees */}
                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <LuCalendar className="text-lg" />
                                                {borrow.status === 'Pending' ? (
                                                    <span>Ngày yêu cầu: {formatDate(borrow.createdAt)}</span>
                                                ) : (
                                                    <span>Ngày mượn: {formatDate(borrow.borrowDate)}</span>
                                                )}
                                            </div>

                                            {borrow.status !== 'Pending' && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <LuClock className="text-lg" />
                                                    <span>Hạn trả: {formatDate(borrow.dueDate)}</span>
                                                </div>
                                            )}

                                            {/* ✅ Ngày trả - show if returned */}
                                            {borrow.returnDate && (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <LuCalendar className="text-lg" />
                                                    <span>Ngày trả: {formatDate(borrow.returnDate)}</span>
                                                </div>
                                            )}

                                            {/* ✅ Số lần gia hạn - show for Membership */}
                                            {borrow.borrowType !== 'Rental' && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <LuTag className="text-lg" />
                                                    <span>
                                                        Số lần gia hạn: {borrow.renewalCount || 0}/{borrow.maxRenewals}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            {/* Existing renew button */}
                                            {borrowService.canRenewByType(borrow) && (
                                                <button
                                                    onClick={() => handleRenew(borrow._id)}
                                                    disabled={actionLoading === borrow._id}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                >
                                                    {actionLoading === borrow._id ? 'Đang xử lý...' : 'Gia hạn'}
                                                </button>
                                            )}

                                            {/* ✅ UPDATED: Review button - cho phép đánh giá khi đã trả hoặc bị hư hỏng */}
                                            {(borrow.status === 'Returned') && (
                                                <button
                                                    onClick={() => handleReviewClick(borrow)}
                                                    disabled={reviewLoading}
                                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                                                >
                                                    <Star size={18} />
                                                    Đánh giá
                                                </button>
                                            )}

                                            {/* Show disabled renew for Rental with tooltip */}
                                            {borrow.borrowType === 'Rental' && borrow.status === 'Borrowed' && (
                                                <div className="relative group">
                                                    <button
                                                        disabled
                                                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                                                    >
                                                        Không thể gia hạn
                                                    </button>
                                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                                        Mượn lẻ không được gia hạn
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => {
                    setShowReviewModal(false);
                    setSelectedBookForReview(null);
                }}
                onSubmit={handleReviewSubmit}
                book={selectedBookForReview?.book || null}
                isLoading={reviewLoading}
            />
        </div>
    );
};

export default MyBorrows;