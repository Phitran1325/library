import { Star } from 'lucide-react';
import type { Review } from '../../services/book.service';

interface ReviewListProps {
    reviews: Review[];
}

export const ReviewList = ({ reviews }: ReviewListProps) => {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-text-light">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h4 className="text-lg font-semibold text-text">Đánh giá từ độc giả</h4>
            {reviews.map((review) => (
                <ReviewItem
                    key={review.id}
                    review={review}
                />
            ))}
        </div>
    );
};

interface ReviewItemProps {
    review: Review;
}

const ReviewItem = ({ review }: ReviewItemProps) => {


    return (
        <article className="p-6 border border-border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold"
                        aria-label={`Avatar của ${review.user.fullName}`}
                    >
                        {review.user.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <p className="font-semibold text-text">{review.user.fullName}</p>
                        <time className="text-sm text-text-light" dateTime={review.createdAt}>
                            {review.createdAt}
                        </time>
                    </div>

                </div>
                <div className="flex" aria-label={`Đánh giá ${review.rating} sao`}>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            size={16}
                            className={
                                i < review.rating
                                    ? 'fill-[var(--color-warning)] text-[var(--color-warning)]'
                                    : 'text-gray-300'
                            }
                        />
                    ))}
                </div>
            </div>

            <p className="text-text-light mb-4 leading-relaxed">{review.comment}</p>

        </article>
    );
};