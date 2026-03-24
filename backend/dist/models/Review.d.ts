import mongoose, { Document, Types } from 'mongoose';
export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';
export interface IReview extends Document {
    user: Types.ObjectId;
    book: Types.ObjectId;
    rating: number;
    comment?: string;
    status: ReviewStatus;
    moderatedBy?: Types.ObjectId;
    moderatedAt?: Date;
    moderationNote?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, {}> & IReview & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Review.d.ts.map