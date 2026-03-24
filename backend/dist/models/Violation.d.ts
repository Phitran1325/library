import mongoose, { Document, Types } from 'mongoose';
export type ViolationType = 'Overdue' | 'Damaged' | 'Lost' | 'LateReturn';
export interface IViolation extends Document {
    user: Types.ObjectId;
    type: ViolationType;
    severity: 'Low' | 'Medium' | 'High';
    borrowId: Types.ObjectId;
    description: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<IViolation, {}, {}, {}, mongoose.Document<unknown, {}, IViolation, {}, {}> & IViolation & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Violation.d.ts.map