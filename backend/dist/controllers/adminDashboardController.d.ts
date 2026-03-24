import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
/**
 * GET /api/admin/dashboard
 * Lấy dữ liệu tổng quan cho dashboard admin
 */
export declare const getAdminDashboard: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=adminDashboardController.d.ts.map