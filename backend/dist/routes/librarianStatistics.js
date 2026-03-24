"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const librarianStatisticsController_1 = require("../controllers/librarianStatisticsController");
const router = express_1.default.Router();
// Tất cả routes đều cần authentication và quyền Librarian
router.use(auth_1.authMiddleware);
router.use((0, auth_1.roleMiddleware)(['Librarian']));
// GET /api/librarian/statistics/personal - Lấy thống kê cá nhân
router.get('/personal', librarianStatisticsController_1.getPersonalStatistics);
// GET /api/librarian/statistics/personal/activity-history - Lấy lịch sử hoạt động
router.get('/personal/activity-history', librarianStatisticsController_1.getActivityHistory);
exports.default = router;
//# sourceMappingURL=librarianStatistics.js.map