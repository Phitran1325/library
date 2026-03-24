import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getMyEbookLibrary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getReadableBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getReadUrl: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateReadingProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=ebookReaderController.d.ts.map