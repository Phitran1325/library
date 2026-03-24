import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';

const router = express.Router();

/**
 * Public dashboard statistics endpoint
 * Combines data from multiple APIs into one unified response:
 * - Total books count
 * - Total readers count
 * - Total borrows in last 30 days
 * - Average rating across all reviews
 */
router.get('/statistics', getDashboardStats);

export default router;
