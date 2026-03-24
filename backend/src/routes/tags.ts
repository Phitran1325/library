import express from 'express';
import * as tagController from '../controllers/tagController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require admin access
router.use(authMiddleware, adminMiddleware);

// GET /admin/tags - Lấy danh sách tags
router.get('/', tagController.getAllTags);

// GET /admin/tags/stats - Thống kê tags
router.get('/stats', tagController.getTagStats);

// GET /admin/tags/:id - Lấy tag theo ID
router.get('/:id', tagController.getTagById);

// POST /admin/tags - Tạo tag mới
router.post('/', tagController.createTag);

// PUT /admin/tags/:id - Cập nhật tag
router.put('/:id', tagController.updateTag);

// PUT /admin/tags/:id/toggle - Bật/tắt tag
router.put('/:id/toggle', tagController.toggleTagStatus);

export default router;
