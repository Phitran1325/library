import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import {
  getEbookAccessList,
  grantAccess,
  updateAccess,
  revokeAccess,
  getMyEbookAccess,
} from '../controllers/ebookAccessController';

const router = Router();

router.use(authMiddleware);

router.get(
  '/me',
  roleMiddleware(['Reader', 'Librarian', 'Admin']),
  getMyEbookAccess
);

router.get(
  '/',
  roleMiddleware(['Admin']),
  getEbookAccessList
);

router.post(
  '/',
  roleMiddleware(['Admin']),
  grantAccess
);

router.patch(
  '/:id',
  roleMiddleware(['Admin']),
  updateAccess
);

router.delete(
  '/:id',
  roleMiddleware(['Admin']),
  revokeAccess
);

export default router;

