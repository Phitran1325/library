"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reminderController_1 = require("../controllers/reminderController");
const router = (0, express_1.Router)();
// Tất cả routes đều cần authentication
router.use(auth_1.authMiddleware);
// GET /api/reminders - Lấy danh sách reminders
router.get('/', reminderController_1.getReminders);
// GET /api/reminders/stats - Lấy thống kê (Admin/Librarian only)
router.get('/stats', reminderController_1.getReminderStats);
// POST /api/reminders/manual/:borrowId - Gửi nhắc nhở thủ công (Admin/Librarian only)
router.post('/manual/:borrowId', reminderController_1.sendManualReminderController);
// POST /api/reminders/process - Xử lý reminders đang chờ (Admin only - for testing)
router.post('/process', reminderController_1.processRemindersController);
// POST /api/reminders/schedule - Tạo lịch reminders mới (Admin only - for testing)
router.post('/schedule', reminderController_1.scheduleRemindersController);
exports.default = router;
//# sourceMappingURL=reminders.js.map