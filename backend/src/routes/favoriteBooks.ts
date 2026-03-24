import express from 'express';
import * as favoriteBooksController from '../controllers/favoriteBooksController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Chỉ Reader mới có quyền quản lý sách yêu thích
router.use(roleMiddleware(['Reader']));

// POST /api/favorite-books - Thêm sách vào danh sách yêu thích
router.post('/', favoriteBooksController.addFavoriteBook);

// GET /api/favorite-books - Lấy danh sách sách yêu thích với phân trang
router.get('/', favoriteBooksController.getFavoriteBooks);

// GET /api/favorite-books/check/:bookId - Kiểm tra sách có trong danh sách yêu thích không
router.get('/check/:bookId', favoriteBooksController.checkFavoriteBook);

// DELETE /api/favorite-books/:bookId - Xóa sách khỏi danh sách yêu thích
router.delete('/:bookId', favoriteBooksController.removeFavoriteBook);

export default router;

