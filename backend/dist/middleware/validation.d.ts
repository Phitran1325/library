import { Request, Response, NextFunction } from 'express';
interface ValidationResult {
    isValid: boolean;
    message?: string;
}
export declare const validateProfileUpdate: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateFullName: (fullName: string) => ValidationResult;
export declare const validatePhoneNumber: (phoneNumber: string) => ValidationResult;
export declare const validateAddress: (address: string) => ValidationResult;
export declare const validateProfileUpdateFields: (fullName?: string, phoneNumber?: string, address?: string) => ValidationResult;
export declare const validateBorrowRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateReturnRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateReviewRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=validation.d.ts.map