import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const listPlans: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPlanById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyMembership: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyMembershipHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const subscribeOrSwitch: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=membershipController.d.ts.map