"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const messageController_1 = require("../controllers/messageController");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authMiddleware);
// Get all conversations for current user
router.get('/conversations', messageController_1.getConversations);
// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', messageController_1.getMessages);
// Send a message
router.post('/send', messageController_1.sendMessage);
// Mark messages as read
router.patch('/conversations/:conversationId/read', messageController_1.markAsRead);
exports.default = router;
//# sourceMappingURL=messages.js.map