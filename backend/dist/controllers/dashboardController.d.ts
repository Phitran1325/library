import { Request, Response } from 'express';
/**
 * GET /api/dashboard/stats
 * Unified endpoint that combines data from 4 separate APIs:
 * - /api/books/count -> totalBooks
 * - /api/users/readers/count -> totalReaders
 * - /api/borrows/stats/last-30-days -> totalBorrowsLast30Days
 * - /api/reviews/average-rating -> averageRating
 */
export declare const getDashboardStats: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=dashboardController.d.ts.map