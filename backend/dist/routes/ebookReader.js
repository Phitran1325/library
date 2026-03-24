"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ebookReaderController_1 = require("../controllers/ebookReaderController");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.use((0, auth_1.roleMiddleware)(['Reader', 'Librarian', 'Admin']));
router.get('/library', ebookReaderController_1.getMyEbookLibrary);
router.get('/books/:bookId', ebookReaderController_1.getReadableBook);
router.get('/books/:bookId/files/:fileId/read-url', ebookReaderController_1.getReadUrl);
router.post('/books/:bookId/files/:fileId/progress', ebookReaderController_1.updateReadingProgress);
exports.default = router;
//# sourceMappingURL=ebookReader.js.map