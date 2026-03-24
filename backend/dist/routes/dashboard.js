"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboardController_1 = require("../controllers/dashboardController");
const router = express_1.default.Router();
/**
 * Public dashboard statistics endpoint
 * Combines data from multiple APIs into one unified response:
 * - Total books count
 * - Total readers count
 * - Total borrows in last 30 days
 * - Average rating across all reviews
 */
router.get('/statistics', dashboardController_1.getDashboardStats);
exports.default = router;
//# sourceMappingURL=dashboard.js.map