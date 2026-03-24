import React from 'react';
import { ShieldAlert, Star } from 'lucide-react';

interface ViolationsReviewsCardProps {
    lowSeverity: number;
    mediumSeverity: number;
    highSeverity: number;
    totalViolations: number;
    violationsLast30Days: number;
    averageRating: number;
    pendingReviews: number;
}

const ViolationsReviewsCard: React.FC<ViolationsReviewsCardProps> = ({
    lowSeverity,
    mediumSeverity,
    highSeverity,
    totalViolations,
    violationsLast30Days,
    averageRating,
    pendingReviews,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                <div className="p-2 bg-orange-50 rounded-lg">
                    <ShieldAlert className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Vi phạm & Đánh giá</h3>
            </div>
            <div className="space-y-4">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Mức độ vi phạm</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-600 mb-2">Nhẹ</p>
                            <p className="text-xl font-bold text-yellow-600">{lowSeverity}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-600 mb-2">Trung bình</p>
                            <p className="text-xl font-bold text-orange-600">{mediumSeverity}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                            <p className="text-xs text-gray-600 mb-2">Nghiêm trọng</p>
                            <p className="text-xl font-bold text-red-600">{highSeverity}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tổng vi phạm</span>
                        <span className="text-base font-bold text-gray-900">{totalViolations}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Vi phạm (30 ngày)</span>
                        <span className="text-base font-bold text-orange-600">{violationsLast30Days}</span>
                    </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-gray-600">Đánh giá TB</span>
                        </div>
                        <span className="text-base font-bold text-yellow-600">{averageRating}/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Chờ duyệt</span>
                        <span className="text-base font-bold text-blue-600">{pendingReviews}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViolationsReviewsCard;
