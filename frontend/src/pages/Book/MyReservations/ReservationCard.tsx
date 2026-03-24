import { useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { reservationService } from '@/services/book.service';
import { formatDate, formatPrice, type Reservation } from '../../../types';
import ReservationConfirmModal from '@/components/common/book/ReservationConfirmModal';


interface ReservationCardProps {
    reservation: Reservation;
    onCancel: (id: string) => Promise<void>;
    onNavigate: (id: string) => void;
    actionLoading: string | null;
}

const ReservationCard = ({
    reservation,
    onCancel,
    onNavigate,
    actionLoading,
}: ReservationCardProps) => {
    const res = reservation;
    const [showCancelModal, setShowCancelModal] = useState(false);

    const getStatusBadge = (status: string) => {
        const statusText = reservationService.getStatusText(status as Reservation['status']);
        const colorClass = reservationService.getStatusColorClass(status as Reservation['status']);

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                {statusText}
            </span>
        );
    };

    if (!res.book) {
        console.error('❌ Missing book data for reservation:', res._id);
        return null;
    }

    const timeRemaining = reservationService.getTimeRemaining(res.expiresAt);
    const canCancel = reservationService.canCancelReservation(res);

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const handleConfirmCancel = async () => {
        await onCancel(res._id);
        setShowCancelModal(false);
    };

    return (
        <>
            <div className="flex-1">
                <h3
                    className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onNavigate(res.book.id || res.book._id)}
                >
                    {res.book.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4">
                    ISBN: {res.book.isbn} | {res.book.category}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {getStatusBadge(res.status)}

                    {(res.status === 'Pending' || res.status === 'Ready') && !timeRemaining.isExpired && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                            <Clock size={14} /> {timeRemaining.formatted}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                        <span className="text-gray-600">Ngày đặt:</span>
                        <span className="ml-2 font-medium text-gray-900">
                            {formatDate(res.createdAt)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Hết hạn:</span>
                        <span className={`ml-2 font-medium ${timeRemaining.isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(res.expiresAt)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className="ml-2 font-medium text-gray-900">
                            {reservationService.getStatusText(res.status)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Giá thuê:</span>
                        <span className="ml-2 font-medium text-gray-900">
                            {formatPrice(res.book.rentalPrice)}
                        </span>
                    </div>
                </div>

                {canCancel && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancelClick}
                            disabled={actionLoading === res._id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {actionLoading === res._id ? 'Đang hủy...' : 'Hủy đặt trước'}
                        </button>
                    </div>
                )}

                {timeRemaining.isExpired && res.status === 'Pending' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>Đặt trước này đã hết hạn. Vui lòng đặt lại nếu vẫn muốn mượn sách.</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            <ReservationConfirmModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleConfirmCancel}
                reservation={res}
                isLoading={actionLoading === res._id}
            />
        </>
    );
};

export default ReservationCard;