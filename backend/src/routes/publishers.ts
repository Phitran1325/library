import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
  togglePublisherStatus
} from '../controllers/publisherController';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /admin/publishers - Lấy danh sách tất cả nhà xuất bản
router.get('/', getAllPublishers);

// GET /admin/publishers/:id - Lấy thông tin chi tiết nhà xuất bản
router.get('/:id', getPublisherById);

// POST /admin/publishers - Tạo nhà xuất bản mới
router.post('/', createPublisher);

// PUT /admin/publishers/:id - Cập nhật nhà xuất bản
router.put('/:id', updatePublisher);

// DELETE /admin/publishers/:id - Xóa nhà xuất bản
router.delete('/:id', deletePublisher);

// PUT /admin/publishers/:id/toggle-status - Bật/tắt nhà xuất bản
router.put('/:id/toggle-status', togglePublisherStatus);

export default router;
