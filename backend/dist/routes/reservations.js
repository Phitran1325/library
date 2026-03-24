"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reservationController_1 = require("../controllers/reservationController");
const router = (0, express_1.Router)();
// Reader endpoints
router.post('/', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), reservationController_1.createReservation);
router.get('/me', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), reservationController_1.listMyReservations);
router.delete('/:id', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), reservationController_1.cancelReservation);
// Admin endpoints
router.get('/', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), reservationController_1.adminListReservations);
router.post('/:id/reject', auth_1.authMiddleware, (0, auth_1.roleMiddleware)(['Admin', 'Librarian']), reservationController_1.rejectReservation);
exports.default = router;
//# sourceMappingURL=reservations.js.map