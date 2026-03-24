"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const librarianMembershipController_1 = require("../controllers/librarianMembershipController");
const router = express_1.default.Router();
// Apply auth and role middleware to all routes
router.use(auth_1.authMiddleware);
router.use((0, auth_1.roleMiddleware)(['Librarian', 'Admin']));
// GET /api/librarian/membership-requests - Get all membership requests
router.get('/', librarianMembershipController_1.listMembershipRequests);
// GET /api/librarian/membership-requests/:id - Get a specific request
router.get('/:id', librarianMembershipController_1.getMembershipRequestById);
// POST /api/librarian/membership-requests/:id/approve - Approve a request
router.post('/:id/approve', librarianMembershipController_1.approveMembershipRequest);
// POST /api/librarian/membership-requests/:id/reject - Reject a request
router.post('/:id/reject', librarianMembershipController_1.rejectMembershipRequest);
exports.default = router;
//# sourceMappingURL=librarianMemberships.js.map