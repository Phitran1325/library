import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IReview extends Document {
  user: Types.ObjectId;
  book: Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  status: ReviewStatus;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  moderationNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người đánh giá là bắt buộc'],
      index: true
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Sách là bắt buộc'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Đánh giá là bắt buộc'],
      min: [1, 'Đánh giá phải từ 1 đến 5'],
      max: [5, 'Đánh giá phải từ 1 đến 5']
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bình luận không được vượt quá 1000 ký tự']
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: {
      type: Date
    },
    moderationNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
    }
  },
  { timestamps: true }
);

// Compound index để đảm bảo mỗi user chỉ đánh giá 1 lần cho mỗi sách
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

// Index để tìm reviews theo book
reviewSchema.index({ book: 1, createdAt: -1 });

// Index để tìm reviews theo user
reviewSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IReview>('Review', reviewSchema);

