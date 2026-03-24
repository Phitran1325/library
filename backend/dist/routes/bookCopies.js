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
const bookCopyController = __importStar(require("../controllers/bookCopyController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Tất cả routes đều cần authentication
router.use(auth_1.authMiddleware);
// GET routes: Admin và Librarian đều xem được (read-only)
// POST/PUT/DELETE: Chỉ Librarian mới có quyền (quản lý bản sao vật lý)
// GET /api/librarian/book-copies - Lấy danh sách tất cả bản sao
router.get('/', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookCopyController.getAllBookCopies);
// GET /api/librarian/book-copies/statistics - Thống kê bản sao
router.get('/statistics', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookCopyController.getBookCopyStatistics);
// GET /api/librarian/book-copies/book/:bookId - Lấy tất cả bản sao của một cuốn sách
router.get('/book/:bookId', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookCopyController.getBookCopiesByBookId);
// GET /api/librarian/book-copies/:id - Lấy thông tin chi tiết bản sao
router.get('/:id', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookCopyController.getBookCopyById);
// POST /api/librarian/book-copies - Tạo bản sao mới (chỉ Librarian)
router.post('/', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.createBookCopy);
// POST /api/librarian/book-copies/bulk - Tạo nhiều bản sao cùng lúc (chỉ Librarian)
router.post('/bulk', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.createBulkBookCopies);
// PUT /api/librarian/book-copies/:id - Cập nhật bản sao (chỉ Librarian)
router.put('/:id', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.updateBookCopy);
// DELETE /api/librarian/book-copies/:id - Xóa bản sao (chỉ Librarian)
router.delete('/:id', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.deleteBookCopy);
// PUT /api/librarian/book-copies/:id/toggle-status - Bật/tắt bản sao (chỉ Librarian)
router.put('/:id/toggle-status', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.toggleBookCopyStatus);
// Status transition helpers (chỉ Librarian)
router.put('/:id/mark-borrowed', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.markBorrowed);
router.put('/:id/mark-returned', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.markReturned);
router.put('/:id/mark-damaged', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.markDamaged);
router.put('/:id/mark-lost', (0, auth_1.roleMiddleware)(['Librarian']), bookCopyController.markLost);
exports.default = router;
//# sourceMappingURL=bookCopies.js.map