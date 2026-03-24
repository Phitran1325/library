import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';

const router = Router();

// Public: list categories
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin-only
router.post('/', authMiddleware, adminMiddleware, createCategory);
router.put('/:id', authMiddleware, adminMiddleware, updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);

export default router;


