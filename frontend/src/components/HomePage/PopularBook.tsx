import type { Book } from "@/types";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Star } from "lucide-react";
import { TiTick } from "react-icons/ti";
import { IoClose } from "react-icons/io5";
import { getBookImage } from "@/utils/book";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface PopularBooksProps {
    books?: Book[];
    hasError?: boolean;
}

const PopularBooks = ({ books = [], hasError = false }: PopularBooksProps) => {
    const navigate = useNavigate();
    const [containerRef, isVisible] = useIntersectionObserver({
        threshold: 0.1,
        freezeOnceVisible: true,
    });

    const handleBookClick = (book: Book) => {
        const bookId = book.slug || book.id || book._id;
        navigate(`/books/${bookId}`);
    };

    const isBookAvailable = (book: Book): boolean => {
        return book.status === 'available' && (book.availableCopies || book.available || 0) > 0;
    };

    const getAvailableCopies = (book: Book): number => {
        return book.availableCopies || book.available || 0;
    };

    return (
        <div ref={containerRef} className="mb-8">
            {/* Header */}
            <div
                className={`bg-primary text-white p-4 rounded-t-lg flex items-center justify-between transition-all duration-700
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
                <div className="flex items-center gap-2">
                    <BookOpen size={28} />
                    <h2 className="text-xl font-bold tracking-wide">SÁCH PHỔ BIẾN</h2>
                </div>
                <button
                    onClick={() => navigate('/books')}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors"
                >
                    <span className="text-sm font-medium">Xem tất cả</span>
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* Content */}
            <div
                className={`bg-white p-8 rounded-b-lg shadow-md transition-all duration-700 delay-100
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
                {books.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="mx-auto mb-4 text-gray-300" size={64} />
                        <p className="text-text-light text-lg mb-2">Chưa có dữ liệu sách</p>
                        <p className="text-text-light text-sm">
                            {hasError ? 'Vui lòng kiểm tra kết nối server' : 'Đang cập nhật sách mới...'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-8">
                        {books.map((book, index) => {
                            const available = isBookAvailable(book);
                            const availableCount = getAvailableCopies(book);

                            return (
                                <div
                                    key={book.id || book._id}
                                    onClick={() => handleBookClick(book)}
                                    className={`cursor-pointer transition-all duration-700 hover:-translate-y-2
                                        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                    style={{ transitionDelay: `${index * 100}ms` }}
                                >
                                    {/* Book Cover */}
                                    <div className="bg-secondary rounded-lg overflow-hidden mb-3 aspect-3/4 relative shadow-sm group">
                                        <img
                                            src={getBookImage(book)}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBookClick(book);
                                                }}
                                                className={`${available
                                                    ? 'bg-white text-primary hover:bg-gray-100'
                                                    : 'bg-gray-400 text-white cursor-not-allowed'
                                                    } px-6 py-2 rounded-md font-semibold transition-colors`}
                                                disabled={!available}
                                            >
                                                {available ? 'Xem chi tiết' : 'Hết sách'}
                                            </button>
                                        </div>

                                        {/* Badges */}
                                        {book.isPremium && (
                                            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                Premium
                                            </div>
                                        )}

                                        {book.isNewRelease && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                Mới
                                            </div>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-sm text-text mb-1 font-medium leading-tight line-clamp-2">
                                        {book.title}
                                    </h3>

                                    {/* Author */}
                                    {book.authorId && (
                                        <p className="text-xs text-text-light mb-1">
                                            {book.authorId.name}
                                        </p>
                                    )}

                                    {/* Volume */}
                                    {book.volume && (
                                        <p className="text-xs text-text-light mb-2">
                                            Tập {book.volume}
                                        </p>
                                    )}

                                    {/* Rating */}
                                    {book.rating > 0 ? (
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => {
                                                    const rating = book.rating || 0;
                                                    const starNumber = i + 1;

                                                    let fillPercentage = 0;
                                                    if (rating >= starNumber) {
                                                        fillPercentage = 100;
                                                    } else if (rating > starNumber - 1) {
                                                        fillPercentage = (rating - (starNumber - 1)) * 100;
                                                    }

                                                    return (
                                                        <div key={i} className="relative inline-block">
                                                            <Star size={14} className="text-gray-300" />
                                                            <div
                                                                className="absolute top-0 left-0 overflow-hidden"
                                                                style={{ width: `${fillPercentage}%` }}
                                                            >
                                                                <Star
                                                                    size={14}
                                                                    className="fill-yellow-400 text-yellow-400"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <span className="text-xs text-text-light">
                                                ({(book.rating || 0).toFixed(1)})
                                            </span>
                                            {book.reviewCount > 0 && (
                                                <span className="text-xs text-text-light">
                                                    • {book.reviewCount}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} className="text-gray-300" />
                                                ))}
                                            </div>
                                            <span className="text-xs text-text-light">(Chưa có đánh giá)</span>
                                        </div>
                                    )}

                                    {/* Price */}
                                    <div className="mb-2">
                                        {book.rentalPrice > 0 && (
                                            <p className="text-sm font-bold text-primary">
                                                Thuê: {book.rentalPrice.toLocaleString('vi-VN')}₫/ngày
                                            </p>
                                        )}
                                    </div>

                                    {/* Availability */}
                                    <p
                                        className={`text-sm font-semibold flex items-center gap-1 ${available ? 'text-green-600' : 'text-red-600'
                                            }`}
                                    >
                                        {available ? (
                                            <>
                                                <TiTick size={20} />
                                                Còn {availableCount} cuốn
                                            </>
                                        ) : (
                                            <>
                                                <IoClose size={20} />
                                                Hết sách
                                            </>
                                        )}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PopularBooks;