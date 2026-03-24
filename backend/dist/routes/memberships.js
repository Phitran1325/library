"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const membershipController_1 = require("../controllers/membershipController");
const router = express_1.default.Router();
// public
router.get('/plans', membershipController_1.listPlans);
router.get('/plans/:id', membershipController_1.getPlanById);
// user
router.get('/me', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), membershipController_1.getMyMembership);
router.get('/me/history', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), membershipController_1.getMyMembershipHistory);
router.post('/subscribe', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), membershipController_1.subscribeOrSwitch);
exports.default = router;
//# sourceMappingURL=memberships.js.map