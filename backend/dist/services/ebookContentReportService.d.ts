import mongoose from 'mongoose';
import { EbookReportIssueType, EbookReportStatus } from '../models/EbookContentReport';
interface CreateReportParams {
    reporterId: string;
    bookId: string;
    digitalFileId?: string;
    issueType: EbookReportIssueType;
    description: string;
    pageNumber?: number;
    evidenceUrls?: string[];
}
interface ListReportParams {
    page?: number;
    limit?: number;
    status?: EbookReportStatus;
    issueType?: EbookReportIssueType;
    bookId?: string;
    reporterId?: string;
    search?: string;
}
interface UpdateReportParams {
    id: string;
    handledBy: string;
    status?: EbookReportStatus;
    resolutionNotes?: string;
}
export declare const submitEbookContentReport: (params: CreateReportParams) => Promise<mongoose.Document<unknown, {}, import("../models/EbookContentReport").IEbookContentReport, {}, {}> & import("../models/EbookContentReport").IEbookContentReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const listEbookContentReports: (params: ListReportParams) => Promise<{
    items: (mongoose.FlattenMaps<import("../models/EbookContentReport").IEbookContentReport> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const listMyContentReports: (reporterId: string, params: Pick<ListReportParams, "page" | "limit" | "status">) => Promise<{
    items: (mongoose.FlattenMaps<import("../models/EbookContentReport").IEbookContentReport> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const getEbookContentReportById: (id: string) => Promise<mongoose.Document<unknown, {}, import("../models/EbookContentReport").IEbookContentReport, {}, {}> & import("../models/EbookContentReport").IEbookContentReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const updateEbookContentReport: (params: UpdateReportParams) => Promise<mongoose.Document<unknown, {}, import("../models/EbookContentReport").IEbookContentReport, {}, {}> & import("../models/EbookContentReport").IEbookContentReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export {};
//# sourceMappingURL=ebookContentReportService.d.ts.map