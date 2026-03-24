import FavoriteBook from '../models/FavoriteBook';
import Book from '../models/Book';
import { createBulkNotifications } from './notificationService';

/**
 * Đánh dấu toàn bộ sách yêu thích cần được thông báo khi sách không còn bản nào.
 */
export async function markFavoritesWaitingForAvailability(bookId: string): Promise<number> {
  const result = await FavoriteBook.updateMany(
    {
      book: bookId,
      notifyOnAvailable: { $ne: false },
      $or: [
        { isWaitingAvailability: { $exists: false } },
        { isWaitingAvailability: false }
      ]
    },
    {
      $set: { isWaitingAvailability: true }
    }
  );

  return result.modifiedCount || 0;
}

/**
 * Tạo thông báo trên web cho độc giả khi sách yêu thích đã có sẵn.
 */
export async function notifyFavoriteReadersIfBookAvailable(bookId: string): Promise<number> {
  const book = await Book.findById(bookId).select('title available isActive status coverImage');
  if (!book || !book.isActive || book.status !== 'available' || (book.available ?? 0) <= 0) {
    return 0;
  }

  const favorites = await FavoriteBook.find({
    book: bookId,
    notifyOnAvailable: { $ne: false },
    $or: [
      { isWaitingAvailability: { $exists: false } },
      { isWaitingAvailability: true }
    ]
  }).populate('user', 'fullName status isActive role');

  const notifyTargets = favorites.filter((favorite) => {
    const user = favorite.user as any;
    return user && user.role === 'Reader' && user.isActive && user.status === 'Active';
  });

  if (notifyTargets.length === 0) {
    return 0;
  }

  await createBulkNotifications(
    notifyTargets.map((favorite) => {
      const user = favorite.user as any;
      return {
        userId: user._id.toString(),
        title: 'Sách yêu thích của bạn đã sẵn sàng',
        message: `Cuốn "${book.title}" hiện đã có ${book.available ?? 0} bản sẵn sàng cho bạn.`,
        type: 'FAVORITE_BOOK_AVAILABLE' as const,
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
    })
  );

  const notifiedIds = notifyTargets.map((favorite) => favorite._id);
  const now = new Date();

  if (notifiedIds.length > 0) {
    await FavoriteBook.updateMany(
      { _id: { $in: notifiedIds } },
      {
        $set: {
          isWaitingAvailability: false,
          lastAvailabilityNotifiedAt: now
        }
      }
    );
  }

  return notifyTargets.length;
}

