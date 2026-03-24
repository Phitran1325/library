import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getPublicBooks,
  getPublicBookById,
  getPublicBookCount,
  downloadBookEbook,
  listBookEbooks,
} from '../controllers/bookController';

const router = express.Router();

// Public routes - không cần authentication hoặc admin privileges
// GET /books - Lấy danh sách sách (công khai)
router.get('/', getPublicBooks);

// GET /books/count - Đếm tổng số sách
router.get('/count', getPublicBookCount);

// Authenticated ebook endpoints (đặt trước /:id để tránh conflict)
router.get('/:id/ebooks', authMiddleware, listBookEbooks);
router.get('/:id/ebooks/:fileId/download', authMiddleware, downloadBookEbook);

// GET /books/:id - Lấy thông tin chi tiết sách (công khai)
router.get('/:id', getPublicBookById);

export default router;

