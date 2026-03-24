import mongoose, { Document } from 'mongoose';
export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Canceled';
export type PaymentType = 'Membership' | 'Rental' | 'Debt';
export interface IPayment extends Document {
    user: mongoose.Types.ObjectId;
    type: PaymentType;
    plan?: mongoose.Types.ObjectId;
    book?: mongoose.Types.ObjectId;
    rentalDays?: number;
    amount: number;
    currency: string;
    provider: 'PayOS';
    providerRef: string;
    checkoutUrl?: string;
    status: PaymentStatus;
    expiresAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Payment;
//# sourceMappingURL=Payment.d.ts.map