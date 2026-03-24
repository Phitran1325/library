//
import { Star } from 'lucide-react';
import { TiTick } from "react-icons/ti";
import { IoClose } from "react-icons/io5";
import type { Book } from '../../types';
import { getBookImage } from '@/utils/book';
import { BookImage } from '../BookDetail';

interface BookCardProps {
    book: Book;
    viewMode: 'grid' | 'list';
    onClick: (bookId: string) => void;
}

const BookCard = ({ book, viewMode, onClick }: BookCardProps) => {
    const bookId = book.slug
        ?? (book as unknown as { id?: string; _id?: string }).id
        ?? (book as unknown as { id?: string; _id?: string })._id
        ?? '';
    const imageSrc =
        book?.coverImage ??
        book?.image ??
        'https://via.placeholder.com/400x550?text=No+Image';
    const volume = (book as unknown as { volume?: number | string }).volume;
    const availableCopies = book.availableCopies ?? book.available ?? 0;

    const derivedAvailable = (() => {
        // Nếu API có trường "isAvailiable" (API typo) hoặc "isAvailable"
        if (book.isAvailiable === false || book.isAvailable === false) return false;
        if (book.isAvailiable === true || book.isAvailable === true) return true;

        // Nếu status = 'available' và số lượng > 0
        if (book.status === 'available' && availableCopies > 0) return true;

        // Default: nếu không bị đánh dấu false → true
        return true;
    })();
    const borrowCount = book.borrowCount ?? 0;
    if (viewMode === 'grid') {
        return (
            <div
                onClick={() => onClick(bookId)}
                className="cursor-pointer transition-transform hover:-translate-y-2"
            >
                <div className="bg-secondary rounded-lg overflow-hidden mb-3 aspect-3/4 relative shadow-sm group">
                    <BookImage
                        src={getBookImage(book)}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />

                    {/* Overlay khi hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick(bookId);
                            }}
                            className={`${derivedAvailable
                                ? 'bg-white text-primary hover:bg-gray-100'
                                : 'bg-gray-400 text-white cursor-not-allowed'
                                } px-6 py-2 rounded-md font-semibold transition-colors`}
                            disabled={!derivedAvailable}
                        >
                            {derivedAvailable ? 'Xem chi tiết' : 'Hết sách'}
                        </button>
                    </div>

                    {/* Badge số lượt mượn */}
                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
                        {borrowCount !== undefined
                            ? `${borrowCount} lượt`
                            : `${Math.floor(Math.random() * 100) + 50} lượt`
                        }
                    </div>
                </div>

                <h3 className="text-sm text-text mb-1 font-medium leading-tight line-clamp-2">
                    {book.title}
                </h3>

                {volume && (
                    <p className="text-xs text-text-light mb-2">
                        Tập {volume}
                    </p>
                )}

                {/* Rating */}
                {book.rating !== undefined ? (
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => {
                                const rating = book.rating ?? 0;
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
                            ({(book.rating ?? 0).toFixed(1)})
                        </span>
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

                {/* Hiển thị trạng thái còn/hết sách */}
                <p className={`text-sm font-semibold flex items-center gap-1 ${derivedAvailable ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {derivedAvailable ? (
                        <>
                            <TiTick size={23} /> Còn sách
                        </>
                    ) : (
                        <>
                            <IoClose size={23} /> Hết sách
                        </>
                    )}
                </p>
            </div>
        );
    }

    // List view mode
    return (
        <div
            onClick={() => onClick(bookId)}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 flex gap-4 p-4 mb-3"
        >
            <div className="w-32 h-40 shrink-0 relative">
                <img
                    src={imageSrc}
                    alt={book.title}
                    className="w-full h-full object-cover"
                />
                {borrowCount !== undefined && (
                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
                        {borrowCount} lượt
                    </div>
                )}
            </div>

            <div className="flex-1">
                <h3 className="text-sm font-semibold text-text mb-2 line-clamp-2 hover:text-primary transition-colors">
                    {book.title}
                </h3>

                {volume && (
                    <p className="text-xs text-text-light mb-2">Tập {volume}</p>
                )}

                {book.rating !== undefined ? (
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => {
                                const rating = book.rating ?? 0;
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
                            ({(book.rating ?? 0).toFixed(1)})
                        </span>
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

                <p className={`text-sm font-semibold flex items-center gap-1 ${derivedAvailable ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {derivedAvailable ? (
                        <>
                            <TiTick size={18} /> Còn sách
                        </>
                    ) : (
                        <>
                            <IoClose size={18} /> Hết sách
                        </>
                    )}
                </p>

                <button className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors">
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
};

export default BookCard;