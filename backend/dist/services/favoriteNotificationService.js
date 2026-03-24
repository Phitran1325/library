"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markFavoritesWaitingForAvailability = markFavoritesWaitingForAvailability;
exports.notifyFavoriteReadersIfBookAvailable = notifyFavoriteReadersIfBookAvailable;
const FavoriteBook_1 = __importDefault(require("../models/FavoriteBook"));
const Book_1 = __importDefault(require("../models/Book"));
const notificationService_1 = require("./notificationService");
/**
 * Đánh dấu toàn bộ sách yêu thích cần được thông báo khi sách không còn bản nào.
 */
async function markFavoritesWaitingForAvailability(bookId) {
    const result = await FavoriteBook_1.default.updateMany({
        book: bookId,
        notifyOnAvailable: { $ne: false },
        $or: [
            { isWaitingAvailability: { $exists: false } },
            { isWaitingAvailability: false }
        ]
    }, {
        $set: { isWaitingAvailability: true }
    });
    return result.modifiedCount || 0;
}
/**
 * Tạo thông báo trên web cho độc giả khi sách yêu thích đã có sẵn.
 */
async function notifyFavoriteReadersIfBookAvailable(bookId) {
    const book = await Book_1.default.findById(bookId).select('title available isActive status coverImage');
    if (!book || !book.isActive || book.status !== 'available' || (book.available ?? 0) <= 0) {
        return 0;
    }
    const favorites = await FavoriteBook_1.default.find({
        book: bookId,
        notifyOnAvailable: { $ne: false },
        $or: [
            { isWaitingAvailability: { $exists: false } },
            { isWaitingAvailability: true }
        ]
    }).populate('user', 'fullName status isActive role');
    const notifyTargets = favorites.filter((favorite) => {
        const user = favorite.user;
        return user && user.role === 'Reader' && user.isActive && user.status === 'Active';
    });
    if (notifyTargets.length === 0) {
        return 0;
    }
    await (0, notificationService_1.createBulkNotifications)(notifyTargets.map((favorite) => {
        const user = favorite.user;
        return {
            userId: user._id.toString(),
            title: 'Sách yêu thích của bạn đã sẵn sàng',
            message: `Cuốn "${book.title}" hiện đã có ${book.available ?? 0} bản sẵn sàng cho bạn.`,
            type: 'FAVORITE_BOOK_AVAILABLE',
            channels: ['IN_APP', 'EMAIL'],
            emailOptions: {
                subject: 'Sách yêu thích của bạn đã sẵn sàng',
                actionLabel: 'Xem sách',
                actionUrl: `${process.env.FRONTEND_BASE_URL || ''}/books/${bookId}`,
                footerNote: 'Bạn nhận được email này vì đã bật thông báo khi sách yêu thích có sẵn.'
            },
            data: {
                bookId,
                bookTitle: book.title,
                available: book.available ?? 0,
                coverImage: book.coverImage
            }
        };
    }));
    const notifiedIds = notifyTargets.map((favorite) => favorite._id);
    const now = new Date();
    if (notifiedIds.length > 0) {
        await FavoriteBook_1.default.updateMany({ _id: { $in: notifiedIds } }, {
            $set: {
                isWaitingAvailability: false,
                lastAvailabilityNotifiedAt: now
            }
        });
    }
    return notifyTargets.length;
}
//# sourceMappingURL=favoriteNotificationService.js.map