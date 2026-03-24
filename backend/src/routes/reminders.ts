import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getReminders,
  sendManualReminderController,
  getReminderStats,
  processRemindersController,
  scheduleRemindersController
} from '../controllers/reminderController';

const router = Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET /api/reminders - Lấy danh sách reminders
router.get('/', getReminders);

// GET /api/reminders/stats - Lấy thống kê (Admin/Librarian only)
router.get('/stats', getReminderStats);

// POST /api/reminders/manual/:borrowId - Gửi nhắc nhở thủ công (Admin/Librarian only)
router.post('/manual/:borrowId', sendManualReminderController);

// POST /api/reminders/process - Xử lý reminders đang chờ (Admin only - for testing)
router.post('/process', processRemindersController);

// POST /api/reminders/schedule - Tạo lịch reminders mới (Admin only - for testing)
router.post('/schedule', scheduleRemindersController);

export default router;

