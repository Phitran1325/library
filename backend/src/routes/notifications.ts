import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  getNotificationStats
} from '../controllers/notificationController';
import {
  getNotificationPreferences,
  updateNotificationPreferences
} from '../controllers/notificationPreferenceController';

const router = Router();

router.use(authMiddleware);

router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);
router.get('/stats', getNotificationStats);
router.get('/', getNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;

