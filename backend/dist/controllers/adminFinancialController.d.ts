import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getFinancialSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=adminFinancialController.d.ts.map