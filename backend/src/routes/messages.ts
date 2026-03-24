import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead
} from '../controllers/messageController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', getMessages);

// Send a message
router.post('/send', sendMessage);

// Mark messages as read
router.patch('/conversations/:conversationId/read', markAsRead);

export default router;

