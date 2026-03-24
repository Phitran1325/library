import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  toggleAuthorStatus,
  getAuthorStats
} from '../controllers/authorController';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /admin/authors - Lấy danh sách tất cả tác giả
router.get('/', getAllAuthors);

// GET /admin/authors/stats - Thống kê tác giả
router.get('/stats', getAuthorStats);

// GET /admin/authors/:id - Lấy thông tin chi tiết tác giả
router.get('/:id', getAuthorById);

// POST /admin/authors - Tạo tác giả mới
router.post('/', createAuthor);

// PUT /admin/authors/:id - Cập nhật tác giả
router.put('/:id', updateAuthor);

// DELETE /admin/authors/:id - Xóa tác giả
router.delete('/:id', deleteAuthor);

// PUT /admin/authors/:id/toggle-status - Bật/tắt tác giả
router.put('/:id/toggle-status', toggleAuthorStatus);

export default router;
