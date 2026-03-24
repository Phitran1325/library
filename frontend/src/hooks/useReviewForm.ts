import { useState, useCallback } from 'react';
import { reviewService } from '../services/book.service';

interface UseReviewFormProps {
    bookId: string | undefined;
    onReviewSubmitted?: () => void;
}

export const useReviewForm = ({ bookId, onReviewSubmitted }: UseReviewFormProps) => {
    const [userReview, setUserReview] = useState({
        rating: 5,
        comment: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const updateRating = useCallback((rating: number) => {
        setUserReview(prev => ({ ...prev, rating }));
    }, []);

    const updateComment = useCallback((comment: string) => {
        setUserReview(prev => ({ ...prev, comment }));
    }, []);

    const submitReview = useCallback(async () => {
        if (!bookId || !userReview.comment.trim()) {
            return {
                success: false,
                message: 'Vui lòng nhập nội dung đánh giá'
            };
        }

        try {
            setSubmitting(true);
            const userId = '1'; // TODO: Get from auth context

            // Truyền đúng thứ tự tham số: bookId, userId, rating, comment
            await reviewService.submitReview(
                bookId,
                userId,
                "Anonymous", // Add userName parameter
                userReview.rating,
                userReview.comment
            );

            // Reset form
            setUserReview({ rating: 5, comment: '' });
            
            // Callback to refresh reviews
            onReviewSubmitted?.();

            return {
                success: true,
                message: 'Cảm ơn bạn đã đánh giá!'
            };
        } catch (error: unknown) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Không thể gửi đánh giá. Vui lòng thử lại!'
            };
        } finally {
            setSubmitting(false);
        }
    }, [bookId, userReview, onReviewSubmitted]);

    const markHelpful = useCallback(async (reviewId: string, currentHelpful: number) => {
        try {
            // Truyền đúng 2 tham số: reviewId và currentHelpful
            await reviewService.markReviewHelpful(reviewId, currentHelpful);
            // Optionally refresh reviews
            onReviewSubmitted?.();
            return { success: true };
        } catch (error) {
            console.error('Error marking review helpful:', error);
            return { success: false };
        }
    }, [onReviewSubmitted]);

    return {
        userReview,
        updateRating,
        updateComment,
        submitReview,
        submitting,
        markHelpful
    };
};