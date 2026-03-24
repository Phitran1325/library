import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const addFavoriteBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeFavoriteBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFavoriteBooks: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkFavoriteBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=favoriteBooksController.d.ts.map