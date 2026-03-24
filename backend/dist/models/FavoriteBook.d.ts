import mongoose, { Document } from 'mongoose';
export interface IFavoriteBook extends Document {
    user: mongoose.Types.ObjectId;
    book: mongoose.Types.ObjectId;
    notifyOnAvailable: boolean;
    isWaitingAvailability: boolean;
    lastAvailabilityNotifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const FavoriteBook: mongoose.Model<IFavoriteBook, {}, {}, {}, mongoose.Document<unknown, {}, IFavoriteBook, {}, {}> & IFavoriteBook & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default FavoriteBook;
//# sourceMappingURL=FavoriteBook.d.ts.map