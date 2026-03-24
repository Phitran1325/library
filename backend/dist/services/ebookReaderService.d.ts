import mongoose from 'mongoose';
interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
}
interface ReadUrlParams {
    userId: string;
    bookId: string;
    fileId: string;
    ttlSeconds?: number;
}
interface ProgressParams {
    userId: string;
    bookId: string;
    fileId: string;
    percentage?: number;
    currentPage?: number;
    totalPages?: number;
    lastLocation?: string;
    deviceInfo?: {
        platform?: string;
        browser?: string;
        appVersion?: string;
    };
}
export declare const listReadableBooks: (userId: string, params: PaginationParams) => Promise<{
    items: any;
    pagination: {
        page: number;
        limit: number;
        total: any;
        totalPages: number;
    };
}>;
export declare const getReadableBookDetail: (userId: string, bookId: string) => Promise<{
    book: {
        id: mongoose.Types.ObjectId;
        title: string;
        coverImage: string | undefined;
        author: mongoose.Types.ObjectId;
        publisher: mongoose.Types.ObjectId;
        isPremium: boolean;
        description: string | undefined;
    };
    files: {
        id: any;
        format: any;
        size: any;
        uploadedAt: any;
        hasProgress: boolean;
        progress: (mongoose.FlattenMaps<import("../models/EbookReadingProgress").IEbookReadingProgress> & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
    }[];
}>;
export declare const getReadUrlForFile: (params: ReadUrlParams) => Promise<{
    url: string;
    expiresIn: number;
    expiresAt: number;
    format: "PDF" | "EPUB";
    fileId: mongoose.Types.ObjectId;
    book: {
        id: mongoose.Types.ObjectId;
        title: string;
    };
}>;
export declare const saveReadingProgress: (params: ProgressParams) => Promise<mongoose.Document<unknown, {}, import("../models/EbookReadingProgress").IEbookReadingProgress, {}, {}> & import("../models/EbookReadingProgress").IEbookReadingProgress & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export {};
//# sourceMappingURL=ebookReaderService.d.ts.map