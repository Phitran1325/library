import mongoose, { Document } from 'mongoose';
export type SubscriptionStatus = 'Active' | 'Expired' | 'Canceled';
export type SubscriptionSource = 'Payment' | 'Admin';
export interface IMembershipSubscription extends Document {
    user: mongoose.Types.ObjectId;
    plan: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    status: SubscriptionStatus;
    source: SubscriptionSource;
    previousSubscriptionId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const MembershipSubscription: mongoose.Model<IMembershipSubscription, {}, {}, {}, mongoose.Document<unknown, {}, IMembershipSubscription, {}, {}> & IMembershipSubscription & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default MembershipSubscription;
//# sourceMappingURL=MembershipSubscription.d.ts.map