import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEbookReadingProgress extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  fileId: Types.ObjectId;
  percentage?: number;
  currentPage?: number;
  totalPages?: number;
  lastLocation?: string;
  lastOpenedAt?: Date;
  deviceInfo?: {
    platform?: string;
    browser?: string;
    appVersion?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EbookReadingProgressSchema = new Schema<IEbookReadingProgress>(
  {
    user: {
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
    fileId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currentPage: {
      type: Number,
      min: 0,
    },
    totalPages: {
      type: Number,
      min: 1,
    },
    lastLocation: {
      type: String,
      trim: true,
    },
    lastOpenedAt: {
      type: Date,
    },
    deviceInfo: {
      platform: { type: String, trim: true },
      browser: { type: String, trim: true },
      appVersion: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    collection: 'ebookReadingProgresses',
  }
);

EbookReadingProgressSchema.index({ user: 1, book: 1, fileId: 1 }, { unique: true });

export default mongoose.model<IEbookReadingProgress>(
  'EbookReadingProgress',
  EbookReadingProgressSchema
);


