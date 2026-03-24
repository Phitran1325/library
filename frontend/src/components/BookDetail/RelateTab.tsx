import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Book } from '../../types';

interface RelatedTabProps {
    relatedBooks: Book[];
}

export const RelatedTab = ({ relatedBooks }: RelatedTabProps) => {
    const navigate = useNavigate();

    const handleBookClick = (book: Book) => {
        // ✅ Ưu tiên slug cho URL đẹp hơn
        const bookIdentifier = book.slug || book._id || book.id;

        if (!bookIdentifier) {
            console.error('Book identifier not found:', book);
            return;
        }

        console.log('Navigate to related book:', bookIdentifier);
        navigate(`/books/${bookIdentifier}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (relatedBooks.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-text-light">Không có sách liên quan</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-bold text-text mb-6">Sách cùng thể loại</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedBooks.map((book) => (
                    <RelatedBookCard
                        key={book.id}
                        book={book}
                        onClick={() => handleBookClick(book)}
                    />
                ))}
            </div>
        </div>
    );
};

interface RelatedBookCardProps {
    book: Book;
    onClick: () => void;
}

const RelatedBookCard = ({ book, onClick }: RelatedBookCardProps) => {
    const isAvailable = book.isAvailable !== false;
    const rating = book.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
        <article
            onClick={onClick}
            className="cursor-pointer transition-transform hover:-translate-y-2 group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            aria-label={`Xem chi tiết sách ${book.title}`}
        >
            <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-shadow">
                <img
                    src={book.image || book.coverImage || '/placeholder-book.jpg'}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
            <h4 className="text-sm font-semibold text-text mb-2 line-clamp-2">
                {book.title}
            </h4>
            <div className="flex items-center gap-1 mb-1" aria-label={`Đánh giá ${rating.toFixed(1)} sao`}>
                {Array.from({ length: 5 }, (_, i) => {
                    const isFilled = i < fullStars;
                    const isHalf = i === fullStars && hasHalfStar;

                    return (
                        <Star
                            key={i}
                            size={14}
                            className={
                                isFilled
                                    ? 'fill-[var(--color-warning)] text-[var(--color-warning)]'
                                    : isHalf
                                        ? 'fill-[var(--color-warning)] text-[var(--color-warning)] opacity-50'
                                        : 'text-gray-300'
                            }
                        />
                    );
                })}
                <span className="text-xs text-text-light ml-1">
                    {rating > 0 ? rating.toFixed(1) : 'Chưa có'}
                </span>
            </div>
            <p
                className={`text-sm font-semibold ${isAvailable
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-error)]'
                    }`}
            >
                {isAvailable ? '✓ Còn sách' : '✗ Hết sách'}
            </p>
        </article>
    );
};