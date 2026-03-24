import React from 'react';
import { Clock } from 'lucide-react';

interface BorrowingActivityCardProps {
    borrowed: number;
    returned: number;
    overdue: number;
    cancelled: number;
    newLast30Days: number;
    returnedLast30Days: number;
}

const BorrowingActivityCard: React.FC<BorrowingActivityCardProps> = ({
    borrowed,
    returned,
    overdue,
    cancelled,
    newLast30Days,
    returnedLast30Days,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Hoạt động mượn sách</h3>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Đang mượn</p>
                        <p className="text-2xl font-bold text-blue-600">{borrowed}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Đã trả</p>
                        <p className="text-2xl font-bold text-green-600">{returned}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Quá hạn</p>
                        <p className="text-2xl font-bold text-red-600">{overdue}</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Đã hủy</p>
                        <p className="text-2xl font-bold text-gray-600">{cancelled}</p>
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Mượn mới (30 ngày)</span>
                        <span className="text-base font-bold text-gray-900">{newLast30Days}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Đã trả (30 ngày)</span>
                        <span className="text-base font-bold text-gray-900">{returnedLast30Days}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BorrowingActivityCard;
