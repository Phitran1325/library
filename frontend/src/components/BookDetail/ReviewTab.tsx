// ==================== UPDATED ReviewsTab.tsx ====================
// Replace entire file: src/components/BookDetail/ReviewsTab.tsx

import { useState } from 'react';
import { RatingStats } from './RatingStats';
import { ReviewList } from './ReviewList';
import type { Review } from '../../services/book.service';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RatingStatsData {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    ratingPercentages?: Record<number, number>;
}

interface ReviewsTabProps {
    reviews: Review[];
    ratingStats: RatingStatsData;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalReviews: number;
    };
    loading?: boolean;
    onPageChange: (page: number) => void;
    onSortChange: (sortBy: 'newest' | 'oldest' | 'rating') => void;
}

export const ReviewsTab = ({
    reviews,
    ratingStats,
    pagination,
    loading = false,
    onPageChange,
    onSortChange,
}: ReviewsTabProps) => {
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');

    const handleSortChange = (newSortBy: 'newest' | 'oldest' | 'rating') => {
        setSortBy(newSortBy);
        onSortChange(newSortBy);
    };

    return (
        <div className="space-y-8">
            {/* Rating Statistics */}
            <RatingStats
                averageRating={ratingStats.averageRating}
                totalReviews={ratingStats.totalReviews}
                ratingDistribution={ratingStats.ratingDistribution}
                ratingPercentages={ratingStats.ratingPercentages}
            />

            {/* Sort Controls */}
            <div className="flex items-center justify-between border-b border-border pb-4">

                <div className="flex items-center gap-2">
                    <span className="text-sm text-text-light">Sắp xếp:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value as 'newest' | 'oldest' | 'rating')}
                        className="px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="rating">Đánh giá cao nhất</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Review List */}
                    {reviews.length > 0 ? (
                        <ReviewList
                            reviews={reviews}
                        />
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-text-light text-lg mb-2">Chưa có đánh giá nào</p>
                            <p className="text-sm text-text-light">
                                Hãy là người đầu tiên đánh giá cuốn sách này
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-6 border-t border-border">
                            {/* Previous Button */}
                            <button
                                onClick={() => onPageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => {
                                    // Show first page, last page, current page, and pages around current
                                    const shouldShow =
                                        page === 1 ||
                                        page === pagination.totalPages ||
                                        Math.abs(page - pagination.currentPage) <= 1;

                                    if (!shouldShow) {
                                        // Show ellipsis
                                        if (page === 2 || page === pagination.totalPages - 1) {
                                            return <span key={page} className="px-2 text-text-light">...</span>;
                                        }
                                        return null;
                                    }

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => onPageChange(page)}
                                            className={`min-w-[36px] h-9 px-3 border rounded-md transition-colors ${page === pagination.currentPage
                                                ? 'bg-primary text-white border-primary'
                                                : 'border-border hover:bg-surface'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={() => onPageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="p-2 border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Info Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    💡 <strong>Lưu ý:</strong> Bạn chỉ có thể đánh giá sách sau khi đã mượn và đọc.
                    Vui lòng mượn sách để có thể viết đánh giá.
                </p>
            </div>
        </div>
    );
};