import mongoose, { Document, Schema, Types } from 'mongoose';

export const EBOOK_REPORT_ISSUE_TYPES = [
  'copyright',
  'formatting',
  'broken_link',
  'typo',
  'offensive',
  'other',
] as const;

export const EBOOK_REPORT_STATUSES = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const;

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

const EbookContentReportSchema = new Schema<IEbookContentReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    digitalFileId: {
      type: Schema.Types.ObjectId,
    },
    issueType: {
      type: String,
      enum: EBOOK_REPORT_ISSUE_TYPES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    pageNumber: {
      type: Number,
      min: 1,
      max: 10000,
    },
    evidenceUrls: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
    status: {
      type: String,
      enum: EBOOK_REPORT_STATUSES,
      default: 'PENDING',
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    handledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    handledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

EbookContentReportSchema.index({ book: 1, status: 1 });
EbookContentReportSchema.index({ reporter: 1, createdAt: -1 });

export default mongoose.model<IEbookContentReport>('EbookContentReport', EbookContentReportSchema);


