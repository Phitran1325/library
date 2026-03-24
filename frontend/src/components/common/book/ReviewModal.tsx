// src/components/MyAccount/MyBorrows/ReviewModal.tsx

import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';

// ✅ Create a minimal book type for review modal
interface ReviewBook {
    _id: string;
    id?: string;
    title: string;
    category?: string;
    image?: string;
    coverImage?: string;
}

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    book: ReviewBook | null; // ✅ Changed from Book to ReviewBook
    isLoading?: boolean;
}

const ReviewModal = ({
    isOpen,
    onClose,
    onSubmit,
    book,
    isLoading = false
}: ReviewModalProps) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [errors, setErrors] = useState<string[]>([]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setHoveredRating(0);
            setComment('');
            setErrors([]);
        }
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !book) return null;

    const validate = (): boolean => {
        const newErrors: string[] = [];

        if (rating === 0) {
            newErrors.push('Vui lòng chọn số sao đánh giá');
        }

        if (!comment.trim()) {
            newErrors.push('Vui lòng nhập nội dung đánh giá');
        } else if (comment.trim().length < 10) {
            newErrors.push('Nội dung đánh giá phải có ít nhất 10 ký tự');
        } else if (comment.trim().length > 1000) {
            newErrors.push('Nội dung đánh giá không được quá 1000 ký tự');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(rating, comment);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all animate-scaleIn overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <Star className="w-6 h-6 text-white fill-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    Đánh giá sách
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Book Info */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                            <div className="flex gap-4">
                                {book.image || book.coverImage ? (
                                    <img
                                        src={book.image || book.coverImage}
                                        alt={book.title}
                                        className="w-16 h-20 object-cover rounded-lg shadow-md"
                                    />
                                ) : (
                                    <div className="w-16 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">📚</span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        {book.title}
                                    </h4>
                                    {book.category && (
                                        <p className="text-sm text-gray-600">
                                            {book.category}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rating Stars */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Đánh giá của bạn <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        disabled={isLoading}
                                        className="transition-transform hover:scale-110 disabled:opacity-50"
                                    >
                                        <Star
                                            size={40}
                                            className={`${star <= (hoveredRating || rating)
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                                {rating > 0 && (
                                    <span className="ml-3 text-lg font-semibold text-amber-600">
                                        {rating}/5
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nhận xét của bạn <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                disabled={isLoading}
                                placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này... (tối thiểu 10 ký tự)"
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none"
                            />
                            <div className="mt-1 flex justify-between text-xs text-gray-500">
                                <span>Tối thiểu 10 ký tự</span>
                                <span className={comment.length > 1000 ? 'text-red-500' : ''}>
                                    {comment.length}/1000
                                </span>
                            </div>
                        </div>

                        {/* Errors */}
                        {errors.length > 0 && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <span className="text-red-600 text-lg">⚠️</span>
                                    <div>
                                        <p className="text-sm font-medium text-red-800 mb-1">
                                            Vui lòng kiểm tra lại:
                                        </p>
                                        <ul className="text-sm text-red-700 space-y-1">
                                            {errors.map((error, index) => (
                                                <li key={index}>• {error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                💡 <strong>Gợi ý:</strong> Hãy chia sẻ cảm nhận chân thực của bạn về nội dung,
                                cách viết, và những điểm bạn thích hoặc chưa thích ở cuốn sách này.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang gửi...
                                </span>
                            ) : (
                                'Gửi đánh giá'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;