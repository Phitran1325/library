import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { getPlanById, listPlans, getMyMembership, getMyMembershipHistory, subscribeOrSwitch } from '../controllers/membershipController';
import { getMyMembershipRequests } from '../controllers/librarianMembershipController';

const router = express.Router();

// public
router.get('/plans', listPlans);
router.get('/plans/:id', getPlanById);

// user
router.get('/me', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), getMyMembership);
router.get('/me/history', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), getMyMembershipHistory);
router.get('/my-requests', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), getMyMembershipRequests);
router.post('/subscribe', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), subscribeOrSwitch);

export default router;


