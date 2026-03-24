import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
    file?: Express.Multer.File;
}
export declare const getAllBooks: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBookById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const toggleBookStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBookStock: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getNewReleases: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getBooksByVolume: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/librarian/books/:id/ebooks
 * Upload ebooks (PDF/EPUB) for a book
 */
export declare const uploadBookEbook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/books/:bookId/ebooks/:fileId/download
 * Generate signed url for ebook download
 */
export declare const downloadBookEbook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/books/:id/ebooks
 * Danh sách ebook của một sách (yêu cầu auth)
 */
export declare const listBookEbooks: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPublicBooks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPublicBookById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=bookController.d.ts.map