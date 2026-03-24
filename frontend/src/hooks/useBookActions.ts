import { useState, useCallback } from 'react';
import { borrowService, purchaseService, bookService } from '../services/book.service';
import type { Book } from '../types';

interface UseBookActionsProps {
    book: Book | null;
    bookId: string | undefined;
}

export const useBookActions = ({ book, bookId }: UseBookActionsProps) => {
    const [quantity, setQuantity] = useState(1);
    const [actionLoading, setActionLoading] = useState(false);

    const handleBorrow = useCallback(async () => {
        if (!bookId) return;

        try {
            setActionLoading(true);
            const userId = '1'; // TODO: Get from auth context

            await borrowService.createBorrowRequest(bookId, userId, quantity);
            
            return {
                success: true,
                message: `Đã thêm ${quantity} cuốn vào danh sách mượn! Thời gian mượn: 14 ngày`
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Không thể mượn sách. Vui lòng thử lại!'
            };
        } finally {
            setActionLoading(false);
        }
    }, [bookId, quantity]);

    const handleBuy = useCallback(async () => {
        if (!bookId || !book) return;

        try {
            setActionLoading(true);
            const userId = '1'; // TODO: Get from auth context
            const unitPrice = book.price || 120000;

            await purchaseService.createPurchaseOrder(
                bookId,
                userId,
                Number(quantity),
                Number(unitPrice)
            );

            const priceInfo = bookService.calculatePrice(book, quantity);
            
            return {
                success: true,
                message: `Đã thêm ${quantity} cuốn vào giỏ hàng!\nTổng tiền: ${bookService.formatPrice(priceInfo.finalPrice)}`
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Không thể mua sách. Vui lòng thử lại!'
            };
        } finally {
            setActionLoading(false);
        }
    }, [bookId, book, quantity]);

    const incrementQuantity = useCallback(() => {
        setQuantity(prev => prev + 1);
    }, []);

    const decrementQuantity = useCallback(() => {
        setQuantity(prev => Math.max(1, prev - 1));
    }, []);

    return {
        quantity,
        setQuantity,
        incrementQuantity,
        decrementQuantity,
        handleBorrow,
        handleBuy,
        actionLoading
    };
};