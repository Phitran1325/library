import mongoose, { Document, Types } from 'mongoose';
export type ReservationStatus = 'Pending' | 'Fulfilled' | 'Cancelled' | 'Expired' | 'Rejected';
export interface IReservation extends Document {
    user: Types.ObjectId;
    book: Types.ObjectId;
    status: ReservationStatus;
    expiresAt?: Date;
    rejectionReason?: string;
    rejectedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IReservation, {}, {}, {}, mongoose.Document<unknown, {}, IReservation, {}, {}> & IReservation & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Reservation.d.ts.map