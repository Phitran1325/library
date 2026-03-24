"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ebookAccessController_1 = require("../controllers/ebookAccessController");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/me', (0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']), ebookAccessController_1.getMyEbookAccess);
router.get('/', (0, auth_1.roleMiddleware)(['Admin']), ebookAccessController_1.getEbookAccessList);
router.post('/', (0, auth_1.roleMiddleware)(['Admin']), ebookAccessController_1.grantAccess);
router.patch('/:id', (0, auth_1.roleMiddleware)(['Admin']), ebookAccessController_1.updateAccess);
router.delete('/:id', (0, auth_1.roleMiddleware)(['Admin']), ebookAccessController_1.revokeAccess);
exports.default = router;
//# sourceMappingURL=ebookAccess.js.map