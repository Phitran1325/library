import React from 'react';
import { BookMarked } from 'lucide-react';

interface ReservationsPaymentsCardProps {
    totalReservations: number;
    pendingReservations: number;
    pendingPayments: number;
    membershipRevenue: number;
    rentalRevenue: number;
    debtRevenue: number;
    formatCurrency: (amount: number) => string;
}

const ReservationsPaymentsCard: React.FC<ReservationsPaymentsCardProps> = ({
    totalReservations,
    pendingReservations,
    pendingPayments,
    membershipRevenue,
    rentalRevenue,
    debtRevenue,
    formatCurrency,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <BookMarked className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Đặt trước & Thanh toán</h3>
            </div>
            <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-5 text-center">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Tổng đặt trước</p>
                    <p className="text-4xl font-bold text-purple-600">{totalReservations}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Chờ xử lý</p>
                        <p className="text-2xl font-bold text-yellow-600">{pendingReservations}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Payment chờ</p>
                        <p className="text-2xl font-bold text-blue-600">{pendingPayments}</p>
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Doanh thu theo loại</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Membership</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(membershipRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Rental</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(rentalRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Phí phạt</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(debtRevenue)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationsPaymentsCard;
