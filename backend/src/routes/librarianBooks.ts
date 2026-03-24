import express from 'express';
import {
  getAllBooks,
  getBookById,
  createBook,
  getNewReleases,
  getBooksByVolume,
  uploadBookEbook,
} from '../controllers/bookController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { createBookForLibrarian, updateBookForLibrarian, deleteBookForLibrarian } from '../controllers/createBookForLibrarian';
import { getAllAuthors, getAllPublishers, getAllTags, uploadImage } from '../controllers/librarianController';
import { ebookUpload, coverUpload } from '../middleware/upload';

const router = express.Router();

// Tất cả routes đều cần authentication và quyền Librarian hoặc Admin
router.use(authMiddleware);
router.use(roleMiddleware(['Librarian', 'Admin']));

// GET /api/librarian/books - Lấy danh sách tất cả sách
router.get('/', getAllBooks);

// GET /api/librarian/books/new-releases - Lấy danh sách sách mới phát hành
// Phải đặt trước /:id để tránh conflict
router.get('/new-releases', getNewReleases);

// GET /api/librarian/books/by-volume/:volume - Lấy sách theo số tập
// Phải đặt trước /:id để tránh conflict
router.get('/by-volume/:volume', getBooksByVolume);
router.get('/authors', getAllAuthors);
router.get('/publishers', getAllPublishers);
router.get('/tags', getAllTags);

// POST /api/librarian/books/upload-image - Upload ảnh bìa
router.post('/upload-image', coverUpload.single('image'), uploadImage);

// POST /api/librarian/books/:id/ebooks - Upload ebook (PDF/EPUB)
router.post('/:id/ebooks', ebookUpload.single('file'), uploadBookEbook);

// GET /api/librarian/books/:id - Lấy thông tin chi tiết sách (phải đặt sau các route cụ thể)
router.get('/:id', getBookById);

// POST /api/librarian/books - Tạo sách mới
// Hỗ trợ upload ảnh bìa: field "cover" (multipart/form-data)
router.post('/', coverUpload.single('cover'), createBookForLibrarian);

// PUT /api/librarian/books/:id - Cập nhật sách
// Có thể gửi ảnh bìa mới qua field "cover"
router.put('/:id', coverUpload.single('cover'), updateBookForLibrarian);

// DELETE /api/librarian/books/:id - Xóa sách
router.delete('/:id', deleteBookForLibrarian);

export default router;