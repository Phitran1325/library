import mongoose, { Document } from 'mongoose';
export type SubscriptionAction = 'Subscribe' | 'Switch' | 'Renew' | 'Cancel' | 'AdminAssign';
export interface ISubscriptionHistory extends Document {
    user: mongoose.Types.ObjectId;
    action: SubscriptionAction;
    oldPlan?: mongoose.Types.ObjectId;
    newPlan?: mongoose.Types.ObjectId;
    note?: string;
    at: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const SubscriptionHistory: mongoose.Model<ISubscriptionHistory, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriptionHistory, {}, {}> & ISubscriptionHistory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default SubscriptionHistory;
//# sourceMappingURL=SubscriptionHistory.d.ts.map