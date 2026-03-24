import express from 'express';
import * as reviewController from '../controllers/reviewController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validateReviewRequest } from '../middleware/validation';

const router = express.Router();

// GET /api/reviews/average-rating - Trung bình đánh giá toàn hệ thống (công khai)
router.get('/average-rating', reviewController.getGlobalAverageRating);

// GET /api/reviews/book/:bookId - Lấy danh sách đánh giá của một sách (công khai)
router.get('/book/:bookId', reviewController.getBookReviews);

// Các routes bên dưới cần authentication + role phù hợp
router.use(authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']));

// GET /api/reviews/me - Lấy danh sách đánh giá của user hiện tại
router.get('/me', reviewController.getMyReviews);

// POST /api/reviews - Tạo đánh giá mới
router.post('/', validateReviewRequest, reviewController.createReview);

// PUT /api/reviews/:id - Cập nhật đánh giá
router.put('/:id', validateReviewRequest, reviewController.updateReview);

// DELETE /api/reviews/:id - Xóa đánh giá
router.delete('/:id', reviewController.deleteReview);

export default router;

