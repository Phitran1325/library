import mongoose, { Document } from 'mongoose';
export interface IBookCopy extends Document {
    bookId: mongoose.Types.ObjectId;
    barcode: string;
    status: 'available' | 'borrowed' | 'reserved' | 'maintenance' | 'lost' | 'damaged';
    location?: string;
    acquisitionDate?: Date;
    purchasePrice?: number;
    notes?: string;
    condition: 'new' | 'good' | 'fair' | 'poor';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const BookCopy: mongoose.Model<IBookCopy, {}, {}, {}, mongoose.Document<unknown, {}, IBookCopy, {}, {}> & IBookCopy & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default BookCopy;
//# sourceMappingURL=BookCopy.d.ts.map