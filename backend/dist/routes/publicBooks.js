"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const bookController_1 = require("../controllers/bookController");
const router = express_1.default.Router();
// Public routes - không cần authentication hoặc admin privileges
// GET /books - Lấy danh sách sách (công khai)
router.get('/', bookController_1.getPublicBooks);
// Authenticated ebook endpoints (đặt trước /:id để tránh conflict)
router.get('/:id/ebooks', auth_1.authMiddleware, bookController_1.listBookEbooks);
router.get('/:id/ebooks/:fileId/download', auth_1.authMiddleware, bookController_1.downloadBookEbook);
// GET /books/:id - Lấy thông tin chi tiết sách (công khai)
router.get('/:id', bookController_1.getPublicBookById);
exports.default = router;
//# sourceMappingURL=publicBooks.js.map