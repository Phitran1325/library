import mongoose, { Document } from 'mongoose';
export type MembershipRequestStatus = 'Pending' | 'Approved' | 'Rejected';
export interface IMembershipRequest extends Document {
    user: mongoose.Types.ObjectId;
    plan: mongoose.Types.ObjectId;
    status: MembershipRequestStatus;
    requestDate: Date;
    processedBy?: mongoose.Types.ObjectId;
    processedAt?: Date;
    rejectionReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const MembershipRequest: mongoose.Model<IMembershipRequest, {}, {}, {}, mongoose.Document<unknown, {}, IMembershipRequest, {}, {}> & IMembershipRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default MembershipRequest;
//# sourceMappingURL=MembershipRequest.d.ts.map