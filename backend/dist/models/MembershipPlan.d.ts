import mongoose, { Document } from 'mongoose';
export interface IMembershipPlan extends Document {
    name: string;
    description: string;
    price: number;
    duration: number;
    maxBorrows: number;
    maxConcurrentBorrows: number;
    discountRate: number;
    features: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const MembershipPlan: mongoose.Model<IMembershipPlan, {}, {}, {}, mongoose.Document<unknown, {}, IMembershipPlan, {}, {}> & IMembershipPlan & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default MembershipPlan;
//# sourceMappingURL=MembershipPlan.d.ts.map