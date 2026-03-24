import { Star } from 'lucide-react';
import type { FormEvent, ChangeEvent } from 'react';

interface ReviewFormProps {
    rating: number;
    comment: string;
    submitting: boolean;
    onRatingChange: (rating: number) => void;
    onCommentChange: (comment: string) => void;
    onSubmit: (e: FormEvent) => void;
}

const RATING_STARS = [1, 2, 3, 4, 5] as const;

export const ReviewForm = ({
    rating,
    comment,
    submitting,
    onRatingChange,
    onCommentChange,
    onSubmit
}: ReviewFormProps) => {
    const handleCommentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        onCommentChange(e.target.value);
    };

    const isSubmitDisabled = submitting || !comment.trim();

    return (
        <div className="bg-surface p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-text mb-4">Viết đánh giá của bạn</h4>
            <form onSubmit={onSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-text mb-2">
                        Đánh giá của bạn
                    </label>
                    <div className="flex gap-2">
                        {RATING_STARS.map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => onRatingChange(star)}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                disabled={submitting}
                                aria-label={`Đánh giá ${star} sao`}
                            >
                                <Star
                                    size={32}
                                    className={
                                        star <= rating
                                            ? 'fill-[var(--color-warning)] text-[var(--color-warning)]'
                                            : 'text-gray-300'
                                    }
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-text mb-2">
                        Nhận xét của bạn
                    </label>
                    <textarea
                        value={comment}
                        onChange={handleCommentChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
                        placeholder="Chia sẻ trải nghiệm của bạn về cuốn sách này..."
                        required
                        disabled={submitting}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className={`px-6 py-2 rounded-md transition-all ${isSubmitDisabled
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
                        }`}
                >
                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
            </form>
        </div>
    );
};