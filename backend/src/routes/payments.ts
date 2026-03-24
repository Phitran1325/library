import express from 'express';
import { payosWebhook } from '../controllers/paymentController';
import { 
  getDebtInfo, 
  payDebt, 
  getDebtHistory, 
  confirmDebtPayment,
  getPendingDebtPayments,
  approveDebtPayment,
  rejectDebtPayment
} from '../controllers/debtController';
import { authMiddleware, requireStaff } from '../middleware/auth';

const router = express.Router();

// Webhook does not require auth but must be protected by signature
router.post('/payos/webhook', express.json({ type: '*/*' }), payosWebhook);

// Debt management endpoints (User)
router.get('/debt/info', authMiddleware, getDebtInfo);
router.post('/debt/pay', authMiddleware, payDebt);
router.get('/debt/history', authMiddleware, getDebtHistory);
router.post('/debt/confirm', authMiddleware, confirmDebtPayment);

// Debt management endpoints (Librarian/Admin)
router.get('/debt/pending', authMiddleware, requireStaff, getPendingDebtPayments);
router.post('/debt/:id/approve', authMiddleware, requireStaff, approveDebtPayment);
router.post('/debt/:id/reject', authMiddleware, requireStaff, rejectDebtPayment);

export default router;


