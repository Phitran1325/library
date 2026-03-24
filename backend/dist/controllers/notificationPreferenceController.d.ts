import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getNotificationPreferences: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateNotificationPreferences: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=notificationPreferenceController.d.ts.map