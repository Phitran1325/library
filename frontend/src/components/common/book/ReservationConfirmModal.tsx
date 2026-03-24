import { useEffect } from 'react';
import { reservationService } from '@/services/book.service';
import { formatDate, formatPrice, type Reservation } from '@/types';
import { X, Calendar, Clock, BookOpen, Tag } from 'lucide-react';

interface ReservationConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    reservation: Reservation | null;
    isLoading?: boolean;
}

const ReservationConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    reservation,
    isLoading = false
}: ReservationConfirmModalProps) => {
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

    if (!isOpen || !reservation) return null;

    const timeRemaining = reservationService.getTimeRemaining(reservation.expiresAt);
    const statusText = reservationService.getStatusText(reservation.status);

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
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">⚠️</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    Xác nhận hủy đặt trước
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
                        {/* Warning Message */}
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                            <p className="text-sm text-red-800 font-medium">
                                Bạn có chắc chắn muốn hủy đặt trước sách này? Hành động này không thể hoàn tác.
                            </p>
                        </div>

                        {/* Book Info Card */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <div className="flex gap-4">
                                {/* Book Cover */}
                                <div className="flex-shrink-0">
                                    {reservation.book.image || reservation.book.coverImage ? (
                                        <img
                                            src={reservation.book.image || reservation.book.coverImage}
                                            alt={reservation.book.title}
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
                                        {reservation.book.title}
                                    </h4>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Tag size={16} className="flex-shrink-0" />
                                            <span className="truncate">
                                                ISBN: {reservation.book.isbn}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <BookOpen size={16} className="flex-shrink-0" />
                                            <span>{reservation.book.category}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${reservation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                reservation.status === 'Ready' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {statusText}
                                            </span>

                                            {!timeRemaining.isExpired && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    ⏱️ {timeRemaining.formatted}
                                                </span>
                                            )}
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
                                            {formatDate(reservation.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${timeRemaining.isExpired ? 'bg-red-100' : 'bg-orange-100'
                                        }`}>
                                        <Clock className={`w-5 h-5 ${timeRemaining.isExpired ? 'text-red-600' : 'text-orange-600'
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Hết hạn</p>
                                        <p className={`text-sm font-semibold ${timeRemaining.isExpired ? 'text-red-600' : 'text-gray-900'
                                            }`}>
                                            {formatDate(reservation.expiresAt)}
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
                                            {formatPrice(reservation.book.rentalPrice)}/ngày
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg">📚</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-1">Số lượng còn</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {reservation.book.availableCopies || reservation.book.available || 0} cuốn
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        {timeRemaining.isExpired && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">⏰</span>
                                    <div>
                                        <p className="text-sm font-medium text-red-800 mb-1">
                                            Đặt trước đã hết hạn
                                        </p>
                                        <p className="text-xs text-red-600">
                                            Bạn có thể hủy và đặt lại nếu vẫn muốn mượn sách này.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Không, giữ lại
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang hủy...
                                </span>
                            ) : (
                                'Xác nhận hủy'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationConfirmModal;