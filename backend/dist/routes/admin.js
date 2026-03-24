"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController = __importStar(require("../controllers/adminController"));
const reviewController_1 = require("../controllers/reviewController");
const adminFinancialController_1 = require("../controllers/adminFinancialController");
const adminDashboardController_1 = require("../controllers/adminDashboardController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Tất cả routes admin đều cần authentication và admin privileges
router.use(auth_1.authMiddleware);
router.use(auth_1.adminMiddleware);
// GET /admin/dashboard - Lấy tổng quan dashboard cho admin
router.get('/dashboard', adminDashboardController_1.getAdminDashboard);
// GET /admin/users - Lấy danh sách tất cả users
router.get('/users', adminController.getAllUsers);
// GET /admin/users/statistics - Thống kê người dùng
router.get('/users/statistics', adminController.getUserStatistics);
// GET /admin/users/:id - Lấy thông tin chi tiết user
router.get('/users/:id', adminController.getUserById);
// PUT /admin/update-role/:id - Thay đổi role của user
router.put('/update-role/:id', adminController.updateUserRole);
// PUT /admin/toggle-status/:id - Bật/tắt tài khoản user
router.put('/toggle-status/:id', adminController.toggleUserStatus);
// DELETE /admin/users/:id - Xóa user
router.delete('/users/:id', adminController.deleteUser);
// GET /admin/books/statistics - Thống kê sách và hoạt động mượn
router.get('/books/statistics', adminController.getBookAndBorrowStatistics);
// GET /admin/financial/overview - Báo cáo tài chính tổng quan
router.get('/financial/overview', adminFinancialController_1.getFinancialSummary);
// POST /admin/users/auto-lock-overdue - Tự động khóa quyền mượn cho user quá hạn >30 ngày
router.post('/users/auto-lock-overdue', adminController.autoLockOverdueUsers);
// POST /admin/users/auto-lock-penalty-debt - Tự động khóa quyền mượn khi nợ phạt vượt mức
router.post('/users/auto-lock-penalty-debt', adminController.autoLockPenaltyDebtUsers);
// Review moderation
router.get('/reviews', reviewController_1.getAdminReviews);
router.post('/reviews/:id/approve', reviewController_1.approveReview);
router.post('/reviews/:id/reject', reviewController_1.rejectReview);
exports.default = router;
//# sourceMappingURL=admin.js.map