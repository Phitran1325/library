import mongoose, { Document } from 'mongoose';
export interface ITag extends Document {
    name: string;
    category: string;
    isActive: boolean;
    bookCount: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const Tag: mongoose.Model<ITag, {}, {}, {}, mongoose.Document<unknown, {}, ITag, {}, {}> & ITag & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Tag;
//# sourceMappingURL=Tag.d.ts.map