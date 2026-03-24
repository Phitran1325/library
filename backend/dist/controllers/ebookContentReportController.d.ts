import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const submitReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyReports: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listReports: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getReportDetail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=ebookContentReportController.d.ts.map