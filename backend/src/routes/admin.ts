import express from 'express';
import * as adminController from '../controllers/adminController';
import {
  getAdminReviews,
  approveReview,
  rejectReview
} from '../controllers/reviewController';
import { getFinancialSummary } from '../controllers/adminFinancialController';
import { getAdminDashboard } from '../controllers/adminDashboardController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

// Tất cả routes admin đều cần authentication và admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /admin/dashboard - Lấy tổng quan dashboard cho admin
router.get('/dashboard', getAdminDashboard);

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
router.get('/financial/overview', getFinancialSummary);

// Review moderation
router.get('/reviews', getAdminReviews);
router.post('/reviews/:id/approve', approveReview);
router.post('/reviews/:id/reject', rejectReview);

export default router;
