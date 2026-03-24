import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const listSubscriptions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const adminAssignPlan: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=adminMembershipController.d.ts.map