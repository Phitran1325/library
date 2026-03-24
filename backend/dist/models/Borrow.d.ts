import mongoose, { Document, Types } from 'mongoose';
export type BorrowStatus = 'Pending' | 'Borrowed' | 'Returned' | 'Overdue' | 'Lost' | 'Damaged' | 'Cancelled' | 'ReturnRequested';
export type BorrowType = 'Membership' | 'Rental';
export interface IBorrow extends Document {
    user: Types.ObjectId;
    book: Types.ObjectId;
    bookCopy?: Types.ObjectId;
    borrowType: BorrowType;
    borrowDate: Date;
    dueDate: Date;
    returnDate?: Date;
    status: BorrowStatus;
    renewalCount: number;
    maxRenewals: number;
    lateFee: number;
    damageFee: number;
    rentalDays?: number;
    rentalPricePerDay?: number;
    totalRentalPrice?: number;
    paymentId?: string;
    notes?: string;
    processedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IBorrow, {}, {}, {}, mongoose.Document<unknown, {}, IBorrow, {}, {}> & IBorrow & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Borrow.d.ts.map