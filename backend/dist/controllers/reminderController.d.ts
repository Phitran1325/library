import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
/**
 * GET /api/reminders
 * Lấy danh sách reminders (cho user hoặc admin/librarian)
 */
export declare const getReminders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/reminders/manual/:borrowId
 * Gửi nhắc nhở thủ công (chỉ Admin/Librarian)
 */
export declare const sendManualReminderController: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/reminders/stats
 * Lấy thống kê reminders (chỉ Admin/Librarian)
 */
export declare const getReminderStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/reminders/process
 * Xử lý reminders đang chờ (chỉ Admin - để test hoặc trigger thủ công)
 */
export declare const processRemindersController: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/reminders/schedule
 * Tạo lịch reminders mới (chỉ Admin - để test hoặc trigger thủ công)
 */
export declare const scheduleRemindersController: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=reminderController.d.ts.map