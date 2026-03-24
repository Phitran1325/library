import { Router } from 'express';
import { authMiddleware, roleMiddleware, requireStaff } from '../middleware/auth';
import { validateBorrowRequest, validateReturnRequest } from '../middleware/validation';
import {
  borrowBook,
  getMyBorrows,
  getMyBorrowingInfo,
  getBorrowById,
  returnBorrowedBook,
  renewBorrowedBook,
  getAllBorrows,
  createRentalPayment,
  calculateLateFees,
  sendReminderForBorrow,
  sendBatchReminders,
  markBookAsLost,
  markBookAsDamaged,
  getPublicBorrowCountLast30Days,
  approveBorrowRequest,
  rejectBorrowRequest,
  requestReturn
} from '../controllers/borrowController';

const router = Router();

// Public stats
router.get('/stats/last-30-days', getPublicBorrowCountLast30Days);

// Reader endpoints
router.post('/payment-link', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), createRentalPayment);
router.post('/', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), validateBorrowRequest, borrowBook);
router.get('/me', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), getMyBorrows);
router.get('/me/current', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), getMyBorrowingInfo);
router.get('/:id', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), getBorrowById);
// Reader yêu cầu trả sách
router.post('/:id/request-return', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), requestReturn);
// Librarian xác nhận trả sách - chỉ Admin/Librarian mới có quyền
router.post('/:id/return', authMiddleware, requireStaff, validateReturnRequest, returnBorrowedBook);
router.post('/:id/renew', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), renewBorrowedBook);

// Admin/Librarian endpoints (phải đặt sau /me tránh conflict)
router.get('/', authMiddleware, roleMiddleware(['Admin', 'Librarian']), getAllBorrows);
router.post('/calculate-late-fees', authMiddleware, roleMiddleware(['Admin']), calculateLateFees);
router.post('/send-reminders/batch', authMiddleware, roleMiddleware(['Admin', 'Librarian']), sendBatchReminders);
router.post('/:id/send-reminder', authMiddleware, roleMiddleware(['Admin', 'Librarian']), sendReminderForBorrow);

// Staff endpoints for marking Lost/Damaged
router.post('/:id/mark-lost', authMiddleware, requireStaff, markBookAsLost);
router.post('/:id/mark-damaged', authMiddleware, requireStaff, markBookAsDamaged);

// Staff endpoints for approving/rejecting pending borrow requests
router.post('/:id/approve', authMiddleware, requireStaff, approveBorrowRequest);
router.post('/:id/reject', authMiddleware, requireStaff, rejectBorrowRequest);

export default router;
