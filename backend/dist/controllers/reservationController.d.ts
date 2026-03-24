import { Request, Response } from 'express';
export declare const createReservation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listMyReservations: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const cancelReservation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const adminListReservations: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectReservation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=reservationController.d.ts.map