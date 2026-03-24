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
const userController = __importStar(require("../controllers/userController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// User routes (protected)
router.get('/profile', auth_1.authMiddleware, userController.getProfile);
router.patch('/profile', auth_1.authMiddleware, userController.updateProfile);
router.post('/avatar', auth_1.authMiddleware, userController.uploadAvatar);
// Admin routes
router.get('/', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin']), userController.getAllUsers);
router.patch('/:userId/role', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin']), userController.updateUserRole);
router.patch('/:userId/status', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin']), userController.updateUserStatus);
router.delete('/:userId', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin']), userController.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map