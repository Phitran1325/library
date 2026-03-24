import mongoose, { Document } from 'mongoose';
export interface IAuthor extends Document {
    name: string;
    biography?: string;
    birthDate?: Date;
    nationality?: string;
    website?: string;
    socialMedia?: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Author: mongoose.Model<IAuthor, {}, {}, {}, mongoose.Document<unknown, {}, IAuthor, {}, {}> & IAuthor & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Author;
//# sourceMappingURL=Author.d.ts.map