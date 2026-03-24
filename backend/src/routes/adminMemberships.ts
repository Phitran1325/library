import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { adminAssignPlan, listHistory, listSubscriptions } from '../controllers/adminMembershipController';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['Admin', 'Librarian']));

router.get('/subscriptions', listSubscriptions);
router.get('/history', listHistory);
router.patch('/users/:userId/assign', adminAssignPlan);

export default router;


