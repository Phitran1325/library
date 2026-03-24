import mongoose, { Document } from 'mongoose';
export interface IBook extends Document {
    title: string;
    slug: string;
    isbn?: string;
    description?: string;
    coverImage?: string;
    pages?: number;
    publicationYear?: number;
    publishedDate?: Date;
    language: string;
    category: string;
    categoryId?: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    publisherId: mongoose.Types.ObjectId;
    tags: string[];
    volume?: number;
    price?: number;
    rentalPrice: number;
    discount: number;
    isNewRelease: boolean;
    isPremium: boolean;
    stock: number;
    available: number;
    rating: number;
    reviewCount: number;
    status: 'available' | 'out_of_stock' | 'discontinued';
    isActive: boolean;
    borrowCount?: number;
    digitalFiles?: Array<{
        _id: mongoose.Types.ObjectId;
        format: 'PDF' | 'EPUB';
        publicId: string;
        url: string;
        size: number;
        uploadedBy: mongoose.Types.ObjectId;
        uploadedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
declare const Book: mongoose.Model<IBook, {}, {}, {}, mongoose.Document<unknown, {}, IBook, {}, {}> & IBook & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Book;
//# sourceMappingURL=Book.d.ts.map