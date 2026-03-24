import mongoose, { Document, Types } from 'mongoose';
export type DebtPaymentMethod = 'PayOS' | 'External';
export interface IDebtPayment extends Document {
    user: Types.ObjectId;
    amount: number;
    method: DebtPaymentMethod;
    debtBefore: number;
    debtAfter: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDebtPayment, {}, {}, {}, mongoose.Document<unknown, {}, IDebtPayment, {}, {}> & IDebtPayment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=DebtPayment.d.ts.map