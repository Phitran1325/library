import mongoose, { Document } from 'mongoose';
export interface IPublisher extends Document {
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Publisher: mongoose.Model<IPublisher, {}, {}, {}, mongoose.Document<unknown, {}, IPublisher, {}, {}> & IPublisher & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Publisher;
//# sourceMappingURL=Publisher.d.ts.map