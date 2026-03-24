import express from 'express';
import * as userController from '../controllers/userController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// Public stats
router.get('/readers/count', userController.getPublicReaderCount);

// User routes (protected)
router.get('/profile', authMiddleware, userController.getProfile);
router.patch('/profile', authMiddleware, userController.updateProfile);
router.post('/avatar', authMiddleware, userController.uploadAvatar);

// Admin routes
router.get('/', authMiddleware, roleMiddleware(['Admin']), userController.getAllUsers);
router.patch('/:userId/role', authMiddleware, roleMiddleware(['Admin']), userController.updateUserRole);
router.patch('/:userId/status', authMiddleware, roleMiddleware(['Admin']), userController.updateUserStatus);
router.delete('/:userId', authMiddleware, roleMiddleware(['Admin']), userController.deleteUser);

export default router;