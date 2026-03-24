import { ClientSession } from 'mongoose';
import { DebtPaymentMethod } from '../models/DebtPayment';
import { CreatePayOSPaymentResult } from './payment/payosService';
declare const MAX_DEBT_ALLOWED = 50000;
/**
 * Tính tổng nợ của user (bao gồm lateFee và damageFee chưa thanh toán)
 */
export declare function calculateTotalDebt(userId: string): Promise<number>;
/**
 * Cập nhật nợ của user khi trả sách
 */
export declare function updateUserDebt(userId: string, totalFee: number): Promise<void>;
interface PayDebtOptions {
    session?: ClientSession;
    method?: DebtPaymentMethod;
    metadata?: Record<string, any>;
}
interface PayOSDebtPaymentOptions {
    expiresInMinutes?: number;
    description?: string;
    metadata?: Record<string, any>;
}
export interface PayOSDebtPaymentResult extends CreatePayOSPaymentResult {
    amount: number;
    debtBefore: number;
    debtAfterEstimate: number;
}
export declare function createPayOSDebtPayment(userId: string, amount: number, options?: PayOSDebtPaymentOptions): Promise<PayOSDebtPaymentResult>;
export declare function applyExternalDebtPayment(userId: string, amount: number, options?: PayDebtOptions): Promise<{
    paidAmount: number;
    remainingDebt: number;
}>;
/**
 * Kiểm tra user có nợ quá giới hạn không
 */
export declare function hasExceededDebtLimit(userId: string): Promise<boolean>;
/**
 * Lấy thông tin nợ của user
 */
export declare function getUserDebtInfo(userId: string): Promise<{
    totalDebt: number;
    canBorrow: boolean;
    exceededLimit: boolean;
}>;
export { MAX_DEBT_ALLOWED };
//# sourceMappingURL=debtService.d.ts.map