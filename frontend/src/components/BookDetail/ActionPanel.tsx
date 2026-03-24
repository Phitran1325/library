import { Heart, Share2, ShoppingCart, AlertCircle } from 'lucide-react';
import type { Book } from '../../types';

interface ActionPanelProps {
    book: Book;
    quantity: number;
    isFavorite: boolean;
    onQuantityChange: (quantity: number) => void;
    onIncrement: () => void;
    onDecrement: () => void;
    onBorrowClick: () => void;
    onReserve: () => void;
    onToggleFavorite: () => void;
    actionLoading?: boolean;
    favoriteLoading?: boolean;
}

export const ActionPanel = ({
    book,
    quantity,
    isFavorite,
    onQuantityChange,
    onIncrement,
    onDecrement,
    onBorrowClick,
    onReserve,
    onToggleFavorite,
    actionLoading = false,
    favoriteLoading = false
}: ActionPanelProps) => {

    const isAvailable = book.status === 'available' && (book.availableCopies || book.available || 0) > 0;
    const maxQuantity = book.availableCopies || book.available || 0;

    // ✅ THÊM: Logic riêng cho đặt trước - cho phép đặt trước khi hết sách
    const canReserve = book.status === 'available' && book.isActive;

    // Validate and handle quantity change
    const handleQuantityChange = (newQuantity: number) => {
        const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
        onQuantityChange(validQuantity);
    };

    // Handle increment with max limit
    const handleIncrement = () => {
        if (quantity < maxQuantity) {
            onIncrement();
        }
    };

    return (
        <div className="bg-background border border-border rounded-lg p-6 sticky top-24">
            {/* Price for borrow Section */}
            <div className="mb-6">
                {book.rentalPrice && book.rentalPrice > 0 ? (
                    <div className="space-y-2">
                        <p className="text-2xl font-bold text-primary">
                            {book.rentalPrice.toLocaleString('vi-VN')}₫/ngày
                        </p>
                        <p className="text-sm text-text-light">
                            Giá thuê theo ngày
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-text-light italic">
                        Không có giá thuê
                    </p>
                )}
            </div>

            {/* Availability Status */}
            <div className="mb-6">
                {isAvailable ? (
                    <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm font-medium">
                            Còn {maxQuantity} cuốn
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-red-600">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        <span className="text-sm font-medium">Hết sách</span>
                    </div>
                )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">
                    Số lượng
                </label>
                <div className={`relative ${quantity >= maxQuantity && maxQuantity > 0 ? 'pb-2' : ''}`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onDecrement}
                            disabled={actionLoading || favoriteLoading || quantity <= 1}
                            className="cursor-pointer w-10 h-10 flex items-center justify-center border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                            disabled={actionLoading || favoriteLoading}
                            className={`cursor-pointer w-20 px-3 py-2 text-center border rounded-md focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${quantity >= maxQuantity && maxQuantity > 0
                                ? 'border-orange-400 focus:border-orange-500 ring-2 ring-orange-100'
                                : 'border-border focus:border-primary'
                                }`}
                        />
                        <button
                            onClick={handleIncrement}
                            disabled={actionLoading || favoriteLoading || quantity >= maxQuantity}
                            className="cursor-pointer w-10 h-10 flex items-center justify-center border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            +
                        </button>
                    </div>

                    {/* Warning Message with Animation */}
                    {quantity >= maxQuantity && maxQuantity > 0 && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-400 rounded-r-md animate-fadeIn">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-orange-800">
                                        Đã đạt số lượng tối đa
                                    </p>
                                    <p className="text-xs text-orange-600 mt-0.5">
                                        Chỉ còn {maxQuantity} cuốn trong thư viện
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
                {/* Borrow Button */}
                {isAvailable ? (
                    <button
                        onClick={onBorrowClick}
                        disabled={actionLoading || favoriteLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {actionLoading ? 'Đang xử lý...' : 'Mượn sách'}
                    </button>
                ) : (
                    <button
                        disabled
                        className="w-full px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                    >
                        Hết sách
                    </button>
                )}

                {/* Reserve Button */}
                <button
                    onClick={onReserve}
                    disabled={actionLoading || favoriteLoading || !canReserve}  // ← Dùng canReserve thay vì !isAvailable
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ShoppingCart size={20} />
                    {actionLoading ? 'Đang xử lý...' : 'Đặt trước'}
                </button>
            </div>

            {/* Info Note */}
            {book.rentalPrice && book.rentalPrice > 0 && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        💡 <strong>Gợi ý:</strong> Chọn "Mượn sách" để xem các tùy chọn mượn theo gói hoặc thuê theo ngày
                    </p>
                </div>
            )}

            {/* Secondary Actions */}
            <div className="flex gap-3 pt-6 border-t border-border">
                <button
                    onClick={onToggleFavorite}
                    disabled={actionLoading || favoriteLoading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isFavorite
                        ? 'border-red-500 bg-red-50 hover:bg-red-100'
                        : 'border-border hover:bg-surface'
                        }`}
                >
                    {favoriteLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Đang xử lý...</span>
                        </>
                    ) : (
                        <>
                            <Heart
                                size={20}
                                className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                            />
                            <span className={`text-sm font-medium ${isFavorite ? 'text-red-500' : 'text-gray-700'}`}>
                                {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                            </span>
                        </>
                    )}
                </button>
                <button
                    disabled={actionLoading || favoriteLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Share2 size={20} />
                    <span className="text-sm">Chia sẻ</span>
                </button>
            </div>
        </div>
    );
};