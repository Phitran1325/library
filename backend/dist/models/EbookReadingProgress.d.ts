import mongoose, { Document, Types } from 'mongoose';
export interface IEbookReadingProgress extends Document {
    user: Types.ObjectId;
    book: Types.ObjectId;
    fileId: Types.ObjectId;
    percentage?: number;
    currentPage?: number;
    totalPages?: number;
    lastLocation?: string;
    lastOpenedAt?: Date;
    deviceInfo?: {
        platform?: string;
        browser?: string;
        appVersion?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IEbookReadingProgress, {}, {}, {}, mongoose.Document<unknown, {}, IEbookReadingProgress, {}, {}> & IEbookReadingProgress & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=EbookReadingProgress.d.ts.map