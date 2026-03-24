import mongoose, { Document, Types } from 'mongoose';
export declare const EBOOK_REPORT_ISSUE_TYPES: readonly ["copyright", "formatting", "broken_link", "typo", "offensive", "other"];
export declare const EBOOK_REPORT_STATUSES: readonly ["PENDING", "IN_REVIEW", "RESOLVED", "DISMISSED"];
export type EbookReportIssueType = (typeof EBOOK_REPORT_ISSUE_TYPES)[number];
export type EbookReportStatus = (typeof EBOOK_REPORT_STATUSES)[number];
export interface IEbookContentReport extends Document {
    reporter: Types.ObjectId;
    book: Types.ObjectId;
    digitalFileId?: Types.ObjectId;
    issueType: EbookReportIssueType;
    description: string;
    pageNumber?: number;
    evidenceUrls?: string[];
    status: EbookReportStatus;
    resolutionNotes?: string;
    handledBy?: Types.ObjectId;
    handledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IEbookContentReport, {}, {}, {}, mongoose.Document<unknown, {}, IEbookContentReport, {}, {}> & IEbookContentReport & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=EbookContentReport.d.ts.map