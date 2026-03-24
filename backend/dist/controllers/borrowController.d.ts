import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
/**
 * POST /api/borrows
 * Tạo yêu cầu mượn sách (Pending status)
 */
export declare const borrowBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/borrows/me
 * Lấy danh sách sách đang mượn của user hiện tại
 */
export declare const getMyBorrows: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/borrows/me/current
 * Lấy số sách đang mượn và thông tin quyền mượn
 */
export declare const getMyBorrowingInfo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/payment-link
 * Tạo payment link cho mượn lẻ
 */
export declare const createRentalPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/borrows/:id
 * Lấy chi tiết một phiếu mượn
 */
export declare const getBorrowById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/:id/request-return
 * Reader yêu cầu trả sách (Borrowed/Overdue -> ReturnRequested)
 */
export declare const requestReturn: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/:id/return
 * Librarian xác nhận trả sách (ReturnRequested/Borrowed/Overdue -> Returned)
 */
export declare const returnBorrowedBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/:id/renew
 * Gia hạn mượn sách
 */
export declare const renewBorrowedBook: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/borrows (Admin/Librarian only)
 * Lấy danh sách tất cả phiếu mượn
 */
export declare const getAllBorrows: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/borrows/history
 * Lấy lịch sử mượn của người dùng
 */
export declare const listMyBorrowHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/calculate-late-fees
 * Tính phạt trễ hạn tự động cho tất cả sách quá hạn
 * Chỉ dành cho Admin hoặc hệ thống
 */
export declare const calculateLateFees: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/:id/send-reminder
 * Gửi thông báo nhắc nhở thủ công cho một phiếu mượn (Admin/Librarian only)
 */
export declare const sendReminderForBorrow: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/:id/mark-lost
 * Staff đánh dấu sách là mất
 */
export declare const markBookAsLost: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/send-reminders/batch
 * Gửi thông báo nhắc nhở cho nhiều phiếu mượn cùng lúc (Admin/Librarian only)
 */
export declare const sendBatchReminders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/:id/mark-damaged
 * Staff đánh dấu sách bị hư hỏng
 */
export declare const markBookAsDamaged: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/:id/approve
 * Librarian chấp nhận yêu cầu mượn sách (Pending -> Borrowed)
 */
export declare const approveBorrowRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/borrows/:id/reject
 * Librarian từ chối yêu cầu mượn sách (Pending -> Cancelled)
 */
export declare const rejectBorrowRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=borrowController.d.ts.map