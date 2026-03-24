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
const bookController = __importStar(require("../controllers/bookController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Tất cả routes đều cần authentication
router.use(auth_1.authMiddleware);
// GET và POST: Admin và Librarian đều có quyền
// PUT/DELETE: Chỉ Admin mới có quyền
// GET /admin/books - Lấy danh sách tất cả sách
router.get('/', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookController.getAllBooks);
// GET /admin/books/new-releases - Lấy danh sách sách mới phát hành (Admin và Librarian)
// Phải đặt trước /:id để tránh conflict
router.get('/new-releases', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookController.getNewReleases);
// GET /admin/books/by-volume/:volume - Lấy sách theo số tập (Admin và Librarian)
// Phải đặt trước /:id để tránh conflict
router.get('/by-volume/:volume', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookController.getBooksByVolume);
// GET /admin/books/:id - Lấy thông tin chi tiết sách (phải đặt sau các route cụ thể)
router.get('/:id', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookController.getBookById);
// POST /admin/books - Tạo sách mới (Admin và Librarian)
router.post('/', (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), bookController.createBook);
// PUT /admin/books/:id - Cập nhật sách (chỉ Admin)
router.put('/:id', (0, auth_1.roleMiddleware)(['Admin']), bookController.updateBook);
// DELETE /admin/books/:id - Xóa sách (chỉ Admin)
router.delete('/:id', (0, auth_1.roleMiddleware)(['Admin']), bookController.deleteBook);
// PUT /admin/books/:id/toggle-status - Bật/tắt sách (chỉ Admin)
router.put('/:id/toggle-status', (0, auth_1.roleMiddleware)(['Admin']), bookController.toggleBookStatus);
// PUT /admin/books/:id/update-stock - Cập nhật số lượng sách (chỉ Admin)
router.put('/:id/update-stock', (0, auth_1.roleMiddleware)(['Admin']), bookController.updateBookStock);
exports.default = router;
//# sourceMappingURL=books.js.map