import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { 
  listMembershipRequests, 
  getMembershipRequestById, 
  approveMembershipRequest, 
  rejectMembershipRequest 
} from '../controllers/librarianMembershipController';

const router = express.Router();

// Apply auth and role middleware to all routes
router.use(authMiddleware);
router.use(roleMiddleware(['Librarian', 'Admin']));

// GET /api/librarian/membership-requests - Get all membership requests
router.get('/', listMembershipRequests);

// GET /api/librarian/membership-requests/:id - Get a specific request
router.get('/:id', getMembershipRequestById);

// POST /api/librarian/membership-requests/:id/approve - Approve a request
router.post('/:id/approve', approveMembershipRequest);

// POST /api/librarian/membership-requests/:id/reject - Reject a request
router.post('/:id/reject', rejectMembershipRequest);

export default router;
