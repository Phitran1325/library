import express from 'express';
import * as bookCopyController from '../controllers/bookCopyController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// GET routes: Admin và Librarian đều xem được (read-only)
// POST/PUT/DELETE: Chỉ Librarian mới có quyền (quản lý bản sao vật lý)

// GET /api/librarian/book-copies - Lấy danh sách tất cả bản sao
router.get('/', roleMiddleware(['Admin', 'Librarian']), bookCopyController.getAllBookCopies);

// GET /api/librarian/book-copies/statistics - Thống kê bản sao
router.get('/statistics', roleMiddleware(['Admin', 'Librarian']), bookCopyController.getBookCopyStatistics);

// GET /api/librarian/book-copies/book/:bookId - Lấy tất cả bản sao của một cuốn sách
router.get('/book/:bookId', roleMiddleware(['Admin', 'Librarian']), bookCopyController.getBookCopiesByBookId);

// GET /api/librarian/book-copies/:id - Lấy thông tin chi tiết bản sao
router.get('/:id', roleMiddleware(['Admin', 'Librarian']), bookCopyController.getBookCopyById);

// POST /api/librarian/book-copies - Tạo bản sao mới (chỉ Librarian)
router.post('/', roleMiddleware(['Librarian']), bookCopyController.createBookCopy);

// POST /api/librarian/book-copies/bulk - Tạo nhiều bản sao cùng lúc (chỉ Librarian)
router.post('/bulk', roleMiddleware(['Librarian']), bookCopyController.createBulkBookCopies);

// PUT /api/librarian/book-copies/:id - Cập nhật bản sao (chỉ Librarian)
router.put('/:id', roleMiddleware(['Librarian']), bookCopyController.updateBookCopy);

// DELETE /api/librarian/book-copies/:id - Xóa bản sao (chỉ Librarian)
router.delete('/:id', roleMiddleware(['Librarian']), bookCopyController.deleteBookCopy);

// PUT /api/librarian/book-copies/:id/toggle-status - Bật/tắt bản sao (chỉ Librarian)
router.put('/:id/toggle-status', roleMiddleware(['Librarian']), bookCopyController.toggleBookCopyStatus);

// Status transition helpers (chỉ Librarian)
router.put('/:id/mark-borrowed', roleMiddleware(['Librarian']), bookCopyController.markBorrowed);
router.put('/:id/mark-returned', roleMiddleware(['Librarian']), bookCopyController.markReturned);
router.put('/:id/mark-damaged', roleMiddleware(['Librarian']), bookCopyController.markDamaged);
router.put('/:id/mark-lost', roleMiddleware(['Librarian']), bookCopyController.markLost);

export default router;

