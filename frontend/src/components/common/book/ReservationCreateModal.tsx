import { useEffect } from 'react';
import { formatPrice, type Book } from '@/types';
import { X, Calendar, Clock, BookOpen, Tag, AlertCircle, CheckCircle } from 'lucide-react';

interface ReservationCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    book: Book | null;
    isLoading?: boolean;
}

const ReservationCreateModal = ({
    isOpen,
    onClose,
    onConfirm,
    book,
    isLoading = false
}: ReservationCreateModalProps) => {
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

    // Calculate expiry time (24 hours from now)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);

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
                    <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📚</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    Xác nhận đặt trước sách
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
                        {/* Info Message */}
                        <div className="mb-6 p-4 bg-cyan-50 border-l-4 border-cyan-500 rounded-r-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-cyan-800 font-medium mb-1">
                                        Điều kiện đặt trước
                                    </p>
                                    <p className="text-xs text-cyan-700">
                                        Bạn sẽ có 24 giờ để đến thư viện lấy sách sau khi đặt trước thành công. Nếu quá thời hạn, đơn đặt trước sẽ tự động hủy.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Book Info Card */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <div className="flex gap-4">
                                {/* Book Cover */}
                                <div className="flex-shrink-0">
                                    {book.image || book.coverImage ? (
                                        <img
                                            src={book.image || book.coverImage}
                                            alt={book.title}
                                            className="w-24 h-32 object-cover rounded-lg shadow-md"
                                        />
                                    ) : (
                                        <div className="w-24 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Book Details */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                        {book.title}
                                    </h4>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Tag size={16} className="flex-shrink-0" />
                                            <span className="truncate">
                                                ISBN: {book.isbn}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <BookOpen size={16} className="flex-shrink-0" />
                                            <span>{book.category}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></div>
                                                Còn {book.availableCopies || book.available || 0} cuốn
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reservation Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Ngày đặt</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date().toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Hết hạn</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {expiryDate.toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            ({expiryDate.toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })})
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg">💰</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Giá thuê</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {formatPrice(book.rentalPrice || 0)}/ngày
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg">⏱️</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Thời gian lấy sách</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            24 giờ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Important Notes */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-800 mb-1">
                                        Quyền lợi khi đặt trước
                                    </p>
                                    <ul className="text-xs text-green-700 space-y-1">
                                        <li>• Đảm bảo có sách khi bạn đến thư viện</li>
                                        <li>• Ưu tiên lấy sách trước người khác</li>
                                        <li>• Nhận thông báo khi sách sẵn sàng</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800 mb-1">
                                        Lưu ý quan trọng
                                    </p>
                                    <ul className="text-xs text-amber-700 space-y-1">
                                        <li>• Vui lòng đến thư viện trong vòng 24 giờ để lấy sách</li>
                                        <li>• Mang theo thẻ thư viện hoặc CMND/CCCD</li>
                                        <li>• Đơn đặt trước có thể bị hủy nếu quá hạn</li>
                                    </ul>
                                </div>
                            </div>
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
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-5 py-2.5 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang xử lý...
                                </span>
                            ) : (
                                'Xác nhận đặt trước'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationCreateModal;