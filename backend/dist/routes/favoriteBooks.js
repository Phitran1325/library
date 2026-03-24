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
const favoriteBooksController = __importStar(require("../controllers/favoriteBooksController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Tất cả routes đều cần authentication
router.use(auth_1.authMiddleware);
// Chỉ Reader mới có quyền quản lý sách yêu thích
router.use((0, auth_1.roleMiddleware)(['Reader']));
// POST /api/favorite-books - Thêm sách vào danh sách yêu thích
router.post('/', favoriteBooksController.addFavoriteBook);
// GET /api/favorite-books - Lấy danh sách sách yêu thích với phân trang
router.get('/', favoriteBooksController.getFavoriteBooks);
// GET /api/favorite-books/check/:bookId - Kiểm tra sách có trong danh sách yêu thích không
router.get('/check/:bookId', favoriteBooksController.checkFavoriteBook);
// DELETE /api/favorite-books/:bookId - Xóa sách khỏi danh sách yêu thích
router.delete('/:bookId', favoriteBooksController.removeFavoriteBook);
exports.default = router;
//# sourceMappingURL=favoriteBooks.js.map