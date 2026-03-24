import { Router } from 'express';
import { 
  authMiddleware, 
  roleMiddleware 
} from '../middleware/auth';
import { 
  createReservationHandler,
  listMyReservations,
  listAllReservations,
  getReservationById,
  approveReservationHandler,
  cancelReservationHandler,
  cancelReservationByLibrarian,
  fulfillReservationHandler,
  rejectReservation,
  expireReservationsHandler
} from '../controllers/reservationController';

const router = Router();

// Reader endpoints
router.post('/', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), createReservationHandler);
router.get('/me', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), listMyReservations);
router.delete('/:id/cancel', authMiddleware, roleMiddleware(['Reader', 'Librarian', 'Admin']), cancelReservationHandler);
router.put('/:id/fulfill', authMiddleware, roleMiddleware(['Librarian', 'Admin']), fulfillReservationHandler);

// Librarian/Admin endpoints
router.get('/', authMiddleware, roleMiddleware(['Admin', 'Librarian']), listAllReservations);
router.get('/:id', authMiddleware, roleMiddleware(['Admin', 'Librarian']), getReservationById);
router.put('/:id/approve', authMiddleware, roleMiddleware(['Admin', 'Librarian']), approveReservationHandler);
router.delete('/:id/cancel-by-librarian', authMiddleware, roleMiddleware(['Admin', 'Librarian']), cancelReservationByLibrarian);
router.post('/:id/reject', authMiddleware, roleMiddleware(['Admin', 'Librarian']), rejectReservation);

// Admin only endpoints
router.post('/expire', authMiddleware, roleMiddleware(['Admin']), expireReservationsHandler);

export default router;