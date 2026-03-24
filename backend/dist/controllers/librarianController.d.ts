import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getAllAuthors: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllPublishers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllTags: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=librarianController.d.ts.map