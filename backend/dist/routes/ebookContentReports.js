"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ebookContentReportController_1 = require("../controllers/ebookContentReportController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post('/', (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), validation_1.validateEbookReportSubmission, ebookContentReportController_1.submitReport);
router.get('/me', (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), ebookContentReportController_1.getMyReports);
router.get('/', (0, auth_1.roleMiddleware)(['Librarian', 'Admin']), ebookContentReportController_1.listReports);
router.get('/:id', (0, auth_1.roleMiddleware)(['Librarian', 'Admin']), ebookContentReportController_1.getReportDetail);
router.patch('/:id', (0, auth_1.roleMiddleware)(['Librarian', 'Admin']), validation_1.validateEbookReportUpdate, ebookContentReportController_1.updateReport);
exports.default = router;
//# sourceMappingURL=ebookContentReports.js.map