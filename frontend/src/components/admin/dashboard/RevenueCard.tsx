import React from 'react';
import { DollarSign } from 'lucide-react';

interface RevenueCardProps {
    totalRevenue: number;
    last30Days: number;
    unpaidFees: number;
    formatCurrency: (amount: number) => string;
}

const RevenueCard: React.FC<RevenueCardProps> = ({
    totalRevenue,
    last30Days,
    unpaidFees,
    formatCurrency,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Doanh thu</h3>
            </div>
            <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">30 ngày qua</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(last30Days)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phí phạt chưa thu</p>
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(unpaidFees)}</p>
                </div>
            </div>
        </div>
    );
};

export default RevenueCard;
