import { Star } from 'lucide-react';

interface RatingStatsProps {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    ratingPercentages?: Record<number, number>;
}

export const RatingStats = ({
    averageRating,
    totalReviews,
    ratingDistribution,
    ratingPercentages
}: RatingStatsProps) => {
    const getPercentage = (star: number): number => {
        if (ratingPercentages) {
            return ratingPercentages[star] || 0;
        }
        if (totalReviews === 0) return 0;
        return (ratingDistribution[star] / totalReviews) * 100;
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-text mb-6">Đánh giá & Nhận xét</h3>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="text-center p-6 bg-surface rounded-lg">
                    <div className="text-5xl font-bold text-primary mb-2">
                        {averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center gap-1 mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                            <Star
                                key={i}
                                size={24}
                                className={
                                    i < Math.round(averageRating)
                                        ? 'fill-[var(--color-warning)] text-[var(--color-warning)]'
                                        : 'text-gray-300'
                                }
                            />
                        ))}
                    </div>
                    <p className="text-text-light">{totalReviews} đánh giá</p>
                </div>

                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                        <RatingBar
                            key={star}
                            star={star}
                            count={ratingDistribution[star]}
                            percentage={getPercentage(star)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

interface RatingBarProps {
    star: number;
    count: number;
    percentage: number;
}

const RatingBar = ({ star, count, percentage }: RatingBarProps) => (
    <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 w-16">
            <span className="text-sm text-text">{star}</span>
            <Star size={14} className="fill-[var(--color-warning)] text-[var(--color-warning)]" />
        </div>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="h-full bg-[var(--color-warning)] transition-all duration-300"
                style={{ width: `${percentage}%` }}
            />
        </div>
        <span className="text-sm text-text-light w-12 text-right">
            {count}
        </span>
    </div>
);