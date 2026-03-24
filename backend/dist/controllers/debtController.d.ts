import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
/**
 * GET /api/payments/debt/info
 * Lấy thông tin nợ của user hiện tại
 */
export declare const getDebtInfo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/payments/debt/pay
 * Thanh toán nợ phí phạt
 */
export declare const payDebt: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/payments/debt/history
 * Lịch sử thanh toán nợ của user
 */
export declare const getDebtHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/payments/debt/confirm
 * Xác nhận thanh toán phí bồi thường (dùng khi webhook không tới)
 */
export declare const confirmDebtPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=debtController.d.ts.map