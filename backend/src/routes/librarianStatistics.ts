import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import {
  getPersonalStatistics,
  getActivityHistory
} from '../controllers/librarianStatisticsController';

const router = express.Router();

// Tất cả routes đều cần authentication và quyền Librarian hoặc Admin
router.use(authMiddleware);
router.use(roleMiddleware(['Librarian', 'Admin']));

// GET /api/librarian/statistics/personal - Lấy thống kê cá nhân
router.get('/personal', getPersonalStatistics);

// GET /api/librarian/statistics/personal/activity-history - Lấy lịch sử hoạt động
router.get('/personal/activity-history', getActivityHistory);

export default router;