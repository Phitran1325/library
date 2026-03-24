"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookController_1 = require("../controllers/bookController");
const auth_1 = require("../middleware/auth");
const createBookForLibrarian_1 = require("../controllers/createBookForLibrarian");
const librarianController_1 = require("../controllers/librarianController");
const librarianController_2 = require("../controllers/librarianController");
const librarianController_3 = require("../controllers/librarianController");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// Tất cả routes đều cần authentication và quyền Librarian
router.use(auth_1.authMiddleware);
router.use((0, auth_1.roleMiddleware)(['Librarian']));
// GET /api/librarian/books - Lấy danh sách tất cả sách
router.get('/', bookController_1.getAllBooks);
// GET /api/librarian/books/new-releases - Lấy danh sách sách mới phát hành
// Phải đặt trước /:id để tránh conflict
router.get('/new-releases', bookController_1.getNewReleases);
// GET /api/librarian/books/by-volume/:volume - Lấy sách theo số tập
// Phải đặt trước /:id để tránh conflict
router.get('/by-volume/:volume', bookController_1.getBooksByVolume);
router.get('/authors', librarianController_1.getAllAuthors);
router.get('/publishers', librarianController_2.getAllPublishers);
router.get('/tags', librarianController_3.getAllTags);
// POST /api/librarian/books/:id/ebooks - Upload ebook (PDF/EPUB)
router.post('/:id/ebooks', upload_1.ebookUpload.single('file'), bookController_1.uploadBookEbook);
// GET /api/librarian/books/:id - Lấy thông tin chi tiết sách (phải đặt sau các route cụ thể)
router.get('/:id', bookController_1.getBookById);
// POST /api/librarian/books - Tạo sách mới
router.post('/', createBookForLibrarian_1.createBookForLibrarian);
// PUT /api/librarian/books/:id - Cập nhật sách
router.put('/:id', createBookForLibrarian_1.updateBookForLibrarian);
// DELETE /api/librarian/books/:id - Xóa sách
router.delete('/:id', createBookForLibrarian_1.deleteBookForLibrarian);
exports.default = router;
//# sourceMappingURL=librarianBooks.js.map