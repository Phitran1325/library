import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import {
  getMyEbookLibrary,
  getReadableBook,
  getReadUrl,
  updateReadingProgress,
} from '../controllers/ebookReaderController';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['Reader', 'Librarian', 'Admin']));

router.get('/library', getMyEbookLibrary);
router.get('/books/:bookId', getReadableBook);
router.get('/books/:bookId/files/:fileId/read-url', getReadUrl);
router.post('/books/:bookId/files/:fileId/progress', updateReadingProgress);

export default router;


