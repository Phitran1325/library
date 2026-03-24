import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
/**
 * GET /api/librarian/statistics/personal
 * Lấy thống kê cá nhân của thủ thư
 */
export declare const getPersonalStatistics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/librarian/statistics/personal/activity-history
 * Lấy lịch sử hoạt động của thủ thư
 */
export declare const getActivityHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=librarianStatisticsController.d.ts.map