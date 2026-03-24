import mongoose, { Document, Schema, Types } from 'mongoose';

export type EbookAccessLevel = 'preview' | 'full';
export type EbookAccessStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface IEbookAccess extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  accessLevel: EbookAccessLevel;
  status: EbookAccessStatus;
  expiresAt?: Date;
  notes?: string;
  grantedBy: Types.ObjectId;
  revokedBy?: Types.ObjectId;
  revokedAt?: Date;
  revokedReason?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EbookAccessSchema = new Schema<IEbookAccess>(
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
    accessLevel: {
      type: String,
      enum: ['preview', 'full'],
      default: 'full',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

EbookAccessSchema.index({ user: 1, book: 1 }, { unique: true });
EbookAccessSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model<IEbookAccess>('EbookAccess', EbookAccessSchema);

