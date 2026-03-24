import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';

interface BookStockCardProps {
    totalStock: number;
    availableStock: number;
    borrowedStock: number;
    lowStock: number;
}

const BookStockCard: React.FC<BookStockCardProps> = ({
    totalStock,
    availableStock,
    borrowedStock,
    lowStock,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Kho sách</h3>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Tổng số lượng</span>
                    <span className="text-lg font-bold text-gray-900">{totalStock}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Còn lại</span>
                    <span className="text-lg font-bold text-green-600">{availableStock}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Đang được mượn</span>
                    <span className="text-lg font-bold text-blue-600">{borrowedStock}</span>
                </div>
                {lowStock > 0 && (
                    <div className="bg-orange-50 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-semibold">{lowStock} sách sắp hết</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookStockCard;
