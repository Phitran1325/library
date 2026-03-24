import { useState, useEffect, useCallback } from 'react';
import { bookService, reviewService, favoriteService, type Review } from '../services/book.service';
import type { Book } from '../types';

// dùng để quản lí data của book detail

interface RatingStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    ratingPercentages?: Record<number, number>;
}

export const useBookDetail = (bookId: string | undefined) => {
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [ratingStats, setRatingStats] = useState<RatingStats>({
        averageRating: 0, 
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [isFavorite, setIsFavorite] = useState(false);

    const fetchBookDetail = useCallback(async () => {
        if (!bookId) return;

        try {
            setLoading(true);
            setError(null);
            const bookData = await bookService.getBookDetail(bookId);
            setBook(bookData);
        } catch (err) {
            console.error('Error fetching book:', err);
            setError('Không thể tải thông tin sách');
        } finally {
            setLoading(false);
        }
    }, [bookId]);

    const fetchRelatedBooks = useCallback(async () => {
        if (!bookId) return;

        try {
            const books = await bookService.getRelatedBooks(bookId, 4);
            setRelatedBooks(books);
        } catch (err) {
            console.error('Error fetching related books:', err);
        }
    }, [bookId]);

    const fetchReviews = useCallback(async () => {
        if (!bookId) return;

        try {
            const [reviewsData, stats] = await Promise.all([
                reviewService.getReviews(bookId),
                reviewService.getRatingStats(bookId)
            ]);

            setReviews(reviewsData);
            setRatingStats(stats);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }
    }, [bookId]);

    const checkIfFavorite = useCallback(async () => {
        if (!bookId) return;

        try {
            const userId = "1"; // TODO: Get from auth context
            const isFav = await favoriteService.isFavorite(userId, bookId);
            setIsFavorite(isFav);
        } catch (err) {
            console.error('Error checking favorite:', err);
        }
    }, [bookId]);

    const toggleFavorite = useCallback(async () => {
        if (!bookId) return;

        try {
            const userId = "1"; // TODO: Get from auth context
            const result = await favoriteService.toggleFavorite(userId, bookId);
            setIsFavorite(result.isFavorite);
            return result;
        } catch (err) {
            console.error('Error toggling favorite:', err);
            throw err;
        }
    }, [bookId]);

    const refreshReviews = useCallback(() => {
        fetchReviews();
    }, [fetchReviews]);

    useEffect(() => {
        if (bookId) {
            fetchBookDetail();
            fetchRelatedBooks();
            fetchReviews();
            checkIfFavorite();
        }
    }, [bookId, fetchBookDetail, fetchRelatedBooks, fetchReviews, checkIfFavorite]);

    return {
        book,
        loading,
        error,
        relatedBooks,
        reviews,
        ratingStats,
        isFavorite,
        toggleFavorite,
        refreshReviews
    };
};