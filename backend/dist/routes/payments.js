"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const debtController_1 = require("../controllers/debtController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Webhook does not require auth but must be protected by signature
router.post('/payos/webhook', express_1.default.json({ type: '*/*' }), paymentController_1.payosWebhook);
// Debt management endpoints
router.get('/debt/info', auth_1.authMiddleware, debtController_1.getDebtInfo);
router.post('/debt/pay', auth_1.authMiddleware, debtController_1.payDebt);
router.get('/debt/history', auth_1.authMiddleware, debtController_1.getDebtHistory);
router.post('/debt/confirm', auth_1.authMiddleware, debtController_1.confirmDebtPayment);
exports.default = router;
//# sourceMappingURL=payments.js.map