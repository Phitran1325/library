import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getAllTags: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTagById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTag: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTag: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const toggleTagStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTagStats: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=tagController.d.ts.map