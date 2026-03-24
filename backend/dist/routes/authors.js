"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const authorController_1 = require("../controllers/authorController");
const router = express_1.default.Router();
// Apply authentication and admin authorization to all routes
router.use(auth_1.authMiddleware);
router.use(auth_1.adminMiddleware);
// GET /admin/authors - Lấy danh sách tất cả tác giả
router.get('/', authorController_1.getAllAuthors);
// GET /admin/authors/stats - Thống kê tác giả
router.get('/stats', authorController_1.getAuthorStats);
// GET /admin/authors/:id - Lấy thông tin chi tiết tác giả
router.get('/:id', authorController_1.getAuthorById);
// POST /admin/authors - Tạo tác giả mới
router.post('/', authorController_1.createAuthor);
// PUT /admin/authors/:id - Cập nhật tác giả
router.put('/:id', authorController_1.updateAuthor);
// DELETE /admin/authors/:id - Xóa tác giả
router.delete('/:id', authorController_1.deleteAuthor);
// PUT /admin/authors/:id/toggle-status - Bật/tắt tác giả
router.put('/:id/toggle-status', authorController_1.toggleAuthorStatus);
exports.default = router;
//# sourceMappingURL=authors.js.map