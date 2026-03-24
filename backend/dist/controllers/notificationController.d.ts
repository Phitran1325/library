import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getNotifications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markNotificationRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markAllNotificationsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=notificationController.d.ts.map