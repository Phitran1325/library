import { Request, Response } from 'express';
import {
  getReadUrlForFile,
  getReadableBookDetail,
  listReadableBooks,
  saveReadingProgress,
} from '../services/ebookReaderService';

interface AuthRequest extends Request {
  user?: any;
}

const ensureAuthUser = (req: AuthRequest) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
};

export const getMyEbookLibrary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = ensureAuthUser(req);
    const { page = '1', limit = '12', search } = req.query as Record<string, string>;

    const data = await listReadableBooks(userId, {
      page: Number(page),
      limit: Number(limit),
      search,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    const message =
      error?.message === 'Unauthorized' ? 'Bạn cần đăng nhập' : error?.message || 'Lỗi hệ thống';
    const status = error?.message === 'Unauthorized' ? 401 : 400;
    console.error('getMyEbookLibrary error:', error);
    return res.status(status).json({ success: false, message });
  }
};

export const getReadableBook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = ensureAuthUser(req);
    const { bookId } = req.params;

    const data = await getReadableBookDetail(userId, bookId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    const message =
      error?.message === 'Unauthorized' ? 'Bạn cần đăng nhập' : error?.message || 'Lỗi hệ thống';
    const status = error?.message === 'Unauthorized' ? 401 : 400;
    console.error('getReadableBook error:', error);
    return res.status(status).json({ success: false, message });
  }
};

export const getReadUrl = async (req: AuthRequest, res: Response) => {
  try {
    const userId = ensureAuthUser(req);
    const { bookId, fileId } = req.params;
    const { ttl } = req.query as Record<string, string>;

    const data = await getReadUrlForFile({
      userId,
      bookId,
      fileId,
      ttlSeconds: ttl ? Number(ttl) : undefined,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    const message =
      error?.message === 'Unauthorized' ? 'Bạn cần đăng nhập' : error?.message || 'Lỗi hệ thống';
    const status = error?.message === 'Unauthorized' ? 401 : 400;
    console.error('getReadUrl error:', error);
    return res.status(status).json({ success: false, message });
  }
};

export const updateReadingProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = ensureAuthUser(req);
    const { bookId, fileId } = req.params;
    const { percentage, currentPage, totalPages, lastLocation, deviceInfo } = req.body || {};

    const progress = await saveReadingProgress({
      userId,
      bookId,
      fileId,
      percentage,
      currentPage,
      totalPages,
      lastLocation,
      deviceInfo,
    });

    return res.status(200).json({
      success: true,
      message: 'Đã lưu tiến trình đọc',
      data: progress,
    });
  } catch (error: any) {
    const message =
      error?.message === 'Unauthorized' ? 'Bạn cần đăng nhập' : error?.message || 'Lỗi hệ thống';
    const status = error?.message === 'Unauthorized' ? 401 : 400;
    console.error('updateReadingProgress error:', error);
    return res.status(status).json({ success: false, message });
  }
};


