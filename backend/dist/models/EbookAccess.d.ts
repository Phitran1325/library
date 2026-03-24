import mongoose, { Document, Types } from 'mongoose';
export type EbookAccessLevel = 'preview' | 'full';
export type EbookAccessStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export interface IEbookAccess extends Document {
    user: Types.ObjectId;
    book: Types.ObjectId;
    accessLevel: EbookAccessLevel;
    status: EbookAccessStatus;
    expiresAt?: Date;
    notes?: string;
    grantedBy: Types.ObjectId;
    revokedBy?: Types.ObjectId;
    revokedAt?: Date;
    revokedReason?: string;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IEbookAccess, {}, {}, {}, mongoose.Document<unknown, {}, IEbookAccess, {}, {}> & IEbookAccess & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=EbookAccess.d.ts.map