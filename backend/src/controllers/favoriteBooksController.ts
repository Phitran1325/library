import { Request, Response } from 'express';
import mongoose from 'mongoose';
import FavoriteBook from '../models/FavoriteBook';
import Book from '../models/Book';

interface AuthRequest extends Request {
  user?: any;
}

// POST /api/favorite-books - Thêm sách vào danh sách yêu thích
export const addFavoriteBook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { bookId, notifyOnAvailable = true } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'bookId là bắt buộc'
      });
    }

    // Kiểm tra sách có tồn tại không
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Sách không tồn tại'
      });
    }

    // Kiểm tra sách đã có trong danh sách yêu thích chưa
    const existingFavorite = await FavoriteBook.findOne({
      user: userId,
      book: bookId
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã có trong danh sách yêu thích'
      });
    }

    const isWaitingAvailability = notifyOnAvailable && (book.available ?? 0) <= 0;

    // Thêm sách vào danh sách yêu thích
    const favoriteBook = await FavoriteBook.create({
      user: userId,
      book: bookId,
      notifyOnAvailable,
      isWaitingAvailability
    });

    await favoriteBook.populate('book');

    return res.status(201).json({
      success: true,
      message: 'Đã thêm sách vào danh sách yêu thích',
      data: { favoriteBook }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã có trong danh sách yêu thích'
      });
    }
    console.error('Error adding favorite book:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm sách yêu thích'
    });
  }
};

// DELETE /api/favorite-books/:bookId - Xóa sách khỏi danh sách yêu thích
export const removeFavoriteBook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { bookId } = req.params;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'bookId không hợp lệ'
      });
    }

    const favoriteBook = await FavoriteBook.findOneAndDelete({
      user: userId,
      book: bookId
    });

    if (!favoriteBook) {
      return res.status(404).json({
        success: false,
        message: 'Sách không có trong danh sách yêu thích'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã xóa sách khỏi danh sách yêu thích'
    });
  } catch (error) {
    console.error('Error removing favorite book:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sách yêu thích'
    });
  }
};

// GET /api/favorite-books - Lấy danh sách sách yêu thích với phân trang
export const getFavoriteBooks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      page = 1,
      limit = 10
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    // Lấy danh sách sách yêu thích, sắp xếp theo createdAt giảm dần (mới nhất trước)
    const favoriteBooks = await FavoriteBook.find({ user: userId })
      .populate({
        path: 'book',
        populate: [
          { path: 'authorId', select: 'name' },
          { path: 'publisherId', select: 'name' },
          { path: 'categoryId', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .skip(skip)
      .limit(Number(limit));

    // Đếm tổng số sách yêu thích
    const total = await FavoriteBook.countDocuments({ user: userId });

    // Lọc bỏ các sách đã bị xóa hoặc không active
    const validFavoriteBooks = favoriteBooks.filter(
      (fb: any) => fb.book && fb.book.isActive !== false
    );

    return res.status(200).json({
      success: true,
      data: {
        favoriteBooks: validFavoriteBooks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting favorite books:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sách yêu thích'
    });
  }
};

// GET /api/favorite-books/check/:bookId - Kiểm tra sách có trong danh sách yêu thích không
export const checkFavoriteBook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { bookId } = req.params;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'bookId không hợp lệ'
      });
    }

    const favoriteBook = await FavoriteBook.findOne({
      user: userId,
      book: bookId
    });

    return res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favoriteBook
      }
    });
  } catch (error) {
    console.error('Error checking favorite book:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra sách yêu thích'
    });
  }
};

