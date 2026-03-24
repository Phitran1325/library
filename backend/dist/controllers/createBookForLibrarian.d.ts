import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const createBookForLibrarian: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBookForLibrarian: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBookForLibrarian: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=createBookForLibrarian.d.ts.map