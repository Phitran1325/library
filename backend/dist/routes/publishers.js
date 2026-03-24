"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const publisherController_1 = require("../controllers/publisherController");
const router = express_1.default.Router();
// Apply authentication and admin authorization to all routes
router.use(auth_1.authMiddleware);
router.use(auth_1.adminMiddleware);
// GET /admin/publishers - Lấy danh sách tất cả nhà xuất bản
router.get('/', publisherController_1.getAllPublishers);
// GET /admin/publishers/:id - Lấy thông tin chi tiết nhà xuất bản
router.get('/:id', publisherController_1.getPublisherById);
// POST /admin/publishers - Tạo nhà xuất bản mới
router.post('/', publisherController_1.createPublisher);
// PUT /admin/publishers/:id - Cập nhật nhà xuất bản
router.put('/:id', publisherController_1.updatePublisher);
// DELETE /admin/publishers/:id - Xóa nhà xuất bản
router.delete('/:id', publisherController_1.deletePublisher);
// PUT /admin/publishers/:id/toggle-status - Bật/tắt nhà xuất bản
router.put('/:id/toggle-status', publisherController_1.togglePublisherStatus);
exports.default = router;
//# sourceMappingURL=publishers.js.map