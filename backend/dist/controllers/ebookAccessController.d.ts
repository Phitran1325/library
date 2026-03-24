import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getEbookAccessList: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const grantAccess: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAccess: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const revokeAccess: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyEbookAccess: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=ebookAccessController.d.ts.map