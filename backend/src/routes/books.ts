import express from 'express';
import * as bookController from '../controllers/bookController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET và POST: Admin và Librarian đều có quyền
// PUT/DELETE: Chỉ Admin mới có quyền

// GET /admin/books - Lấy danh sách tất cả sách
router.get('/', roleMiddleware(['Admin', 'Librarian']), bookController.getAllBooks);

// GET /admin/books/new-releases - Lấy danh sách sách mới phát hành (Admin và Librarian)
// Phải đặt trước /:id để tránh conflict
router.get('/new-releases', roleMiddleware(['Admin', 'Librarian']), bookController.getNewReleases);

// GET /admin/books/by-volume/:volume - Lấy sách theo số tập (Admin và Librarian)
// Phải đặt trước /:id để tránh conflict
router.get('/by-volume/:volume', roleMiddleware(['Admin', 'Librarian']), bookController.getBooksByVolume);

// GET /admin/books/:id - Lấy thông tin chi tiết sách (phải đặt sau các route cụ thể)
router.get('/:id', roleMiddleware(['Admin', 'Librarian']), bookController.getBookById);

// POST /admin/books - Tạo sách mới (Admin và Librarian)
router.post('/', roleMiddleware(['Admin', 'Librarian']), bookController.createBook);

// PUT /admin/books/:id - Cập nhật sách (chỉ Admin)
router.put('/:id', roleMiddleware(['Admin']), bookController.updateBook);

// DELETE /admin/books/:id - Xóa sách (chỉ Admin)
router.delete('/:id', roleMiddleware(['Admin']), bookController.deleteBook);

// PUT /admin/books/:id/toggle-status - Bật/tắt sách (chỉ Admin)
router.put('/:id/toggle-status', roleMiddleware(['Admin']), bookController.toggleBookStatus);

// PUT /admin/books/:id/update-stock - Cập nhật số lượng sách (chỉ Admin)
router.put('/:id/update-stock', roleMiddleware(['Admin']), bookController.updateBookStock);

export default router;
