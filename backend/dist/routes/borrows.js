"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const borrowController_1 = require("../controllers/borrowController");
const router = (0, express_1.Router)();
// Reader endpoints
router.post('/payment-link', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), borrowController_1.createRentalPayment);
router.post('/', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), validation_1.validateBorrowRequest, borrowController_1.borrowBook);
router.get('/me', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), borrowController_1.getMyBorrows);
router.get('/me/current', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), borrowController_1.getMyBorrowingInfo);
router.get('/:id', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), borrowController_1.getBorrowById);
// Reader yêu cầu trả sách
router.post('/:id/request-return', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), borrowController_1.requestReturn);
// Librarian xác nhận trả sách - chỉ Admin/Librarian mới có quyền
router.post('/:id/return', auth_1.authMiddleware, auth_1.requireStaff, validation_1.validateReturnRequest, borrowController_1.returnBorrowedBook);
router.post('/:id/renew', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), borrowController_1.renewBorrowedBook);
// Admin/Librarian endpoints (phải đặt sau /me tránh conflict)
router.get('/', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), borrowController_1.getAllBorrows);
router.post('/calculate-late-fees', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin']), borrowController_1.calculateLateFees);
router.post('/send-reminders/batch', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), borrowController_1.sendBatchReminders);
router.post('/:id/send-reminder', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), borrowController_1.sendReminderForBorrow);
// Staff endpoints for marking Lost/Damaged
router.post('/:id/mark-lost', auth_1.authMiddleware, auth_1.requireStaff, borrowController_1.markBookAsLost);
router.post('/:id/mark-damaged', auth_1.authMiddleware, auth_1.requireStaff, borrowController_1.markBookAsDamaged);
// Staff endpoints for approving/rejecting pending borrow requests
router.post('/:id/approve', auth_1.authMiddleware, auth_1.requireStaff, borrowController_1.approveBorrowRequest);
router.post('/:id/reject', auth_1.authMiddleware, auth_1.requireStaff, borrowController_1.rejectBorrowRequest);
exports.default = router;
//# sourceMappingURL=borrows.js.map