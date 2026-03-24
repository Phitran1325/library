import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
/**
 * POST /api/reviews
 * Tạo đánh giá mới cho sách
 */
export declare const createReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PUT /api/reviews/:id
 * Cập nhật đánh giá
 */
export declare const updateReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * DELETE /api/reviews/:id
 * Xóa đánh giá
 */
export declare const deleteReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/reviews/book/:bookId
 * Lấy danh sách đánh giá của một sách
 */
export declare const getBookReviews: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/reviews/me
 * Lấy danh sách đánh giá của user hiện tại
 */
export declare const getMyReviews: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/admin/reviews
 * Admin xem danh sách đánh giá (lọc theo trạng thái)
 */
export declare const getAdminReviews: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/admin/reviews/:id/approve
 */
export declare const approveReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/admin/reviews/:id/reject
 */
export declare const rejectReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=reviewController.d.ts.map