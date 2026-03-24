import React from 'react';
import { Star, User, Building, Calendar, BookOpen, Tag } from 'lucide-react';
import type { Book } from '../../types';


interface BookInfoProps {
    book: Book;
}

export const BookInfo = ({ book }: BookInfoProps) => {
    return (
        <div className="space-y-6">
            {/* Title and Basic Info */}
            <div>
                <h1 className="text-3xl font-bold text-text mb-3">{book.title}</h1>

                {/* Rating */}
                {book.rating !== undefined ? (
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => {
                                const rating = book.rating ?? 0;
                                const starNumber = i + 1;

                                // Tính phần trăm fill của sao
                                let fillPercentage = 0;
                                if (rating >= starNumber) {
                                    fillPercentage = 100; // Sao đầy
                                } else if (rating > starNumber - 1) {
                                    fillPercentage = (rating - (starNumber - 1)) * 100; // Sao một phần
                                }

                                return (
                                    <div key={i} className="relative inline-block">
                                        {/* Sao nền (màu xám) */}
                                        <Star size={14} className="text-gray-300" />

                                        {/* Sao phủ màu vàng */}
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
                    // Nếu không có rating
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className="text-gray-300" />
                            ))}
                        </div>
                        <span className="text-xs text-text-light">(Chưa có đánh giá)</span>
                    </div>
                )}


                <p className="text-text-light leading-relaxed">{book.description}</p>
            </div>

            {/* Book Details */}
            <div className="space-y-3 py-6 border-y border-border">
                <DetailRow icon={<User size={20} />} label="Tác giả" value={book.author ?? 'Unknown'} />
                <DetailRow icon={<Building size={20} />} label="Nhà xuất bản" value={book.publisher ?? 'Unknown'} />
                <DetailRow icon={<Calendar size={20} />} label="Năm xuất bản" value={book.publishYear ?? 'Unknown'} />
                <DetailRow icon={<BookOpen size={20} />} label="Số trang" value={book.pages ?? 'Unknown'} />
                <DetailRow icon={<Tag size={20} />} label="Thể loại" value={book.category ?? 'Unknown'} />
            </div>
            
            {/* Availability Status */}
            <div className="flex items-center gap-2">
                <div
                    className={`w-3 h-3 rounded-full ${book.isAvailable !== false ? 'bg-(--color-success)' : 'bg-(--color-error)'
                        }`}
                />
                <span
                    className={`font-semibold ${book.isAvailable !== false ? 'text-(--color-success)' : 'text-(--color-error)'
                        }`}
                >
                    {book.isAvailable !== false ? 'Còn sách' : 'Hết sách'}
                </span>
            </div>
        
             
        </div>
    );
};

interface DetailRowProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div className="flex-1">
            <span className="text-text-light">{label}:</span>
            <span className="ml-2 text-text font-medium">{value}</span>
        </div>
    </div>
);