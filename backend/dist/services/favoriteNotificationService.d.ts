/**
 * Đánh dấu toàn bộ sách yêu thích cần được thông báo khi sách không còn bản nào.
 */
export declare function markFavoritesWaitingForAvailability(bookId: string): Promise<number>;
/**
 * Tạo thông báo trên web cho độc giả khi sách yêu thích đã có sẵn.
 */
export declare function notifyFavoriteReadersIfBookAvailable(bookId: string): Promise<number>;
//# sourceMappingURL=favoriteNotificationService.d.ts.map