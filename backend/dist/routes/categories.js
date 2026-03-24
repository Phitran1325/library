"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const categoryController_1 = require("../controllers/categoryController");
const router = (0, express_1.Router)();
// Public: list categories
router.get('/', categoryController_1.getCategories);
router.get('/:id', categoryController_1.getCategoryById);
// Admin-only
router.post('/', auth_1.authMiddleware, auth_1.adminMiddleware, categoryController_1.createCategory);
router.put('/:id', auth_1.authMiddleware, auth_1.adminMiddleware, categoryController_1.updateCategory);
router.delete('/:id', auth_1.authMiddleware, auth_1.adminMiddleware, categoryController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=categories.js.map