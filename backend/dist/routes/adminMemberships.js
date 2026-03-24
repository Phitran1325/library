"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const adminMembershipController_1 = require("../controllers/adminMembershipController");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use(auth_1.adminMiddleware);
router.get('/subscriptions', adminMembershipController_1.listSubscriptions);
router.get('/history', adminMembershipController_1.listHistory);
router.patch('/users/:userId/assign', adminMembershipController_1.adminAssignPlan);
exports.default = router;
//# sourceMappingURL=adminMemberships.js.map