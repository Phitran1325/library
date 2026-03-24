import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import {
  getMyReports,
  getReportDetail,
  listReports,
  submitReport,
  updateReport,
} from '../controllers/ebookContentReportController';
import { validateEbookReportSubmission, validateEbookReportUpdate } from '../middleware/validation';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware(['Reader', 'Librarian', 'Admin']),
  validateEbookReportSubmission,
  submitReport
);

router.get('/me', roleMiddleware(['Reader', 'Librarian', 'Admin']), getMyReports);

router.get('/', roleMiddleware(['Librarian', 'Admin']), listReports);

router.get('/:id', roleMiddleware(['Librarian', 'Admin']), getReportDetail);

router.patch(
  '/:id',
  roleMiddleware(['Librarian', 'Admin']),
  validateEbookReportUpdate,
  updateReport
);

export default router;


