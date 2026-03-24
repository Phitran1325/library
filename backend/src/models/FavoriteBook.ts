import mongoose, { Document, Schema } from 'mongoose';

export interface IFavoriteBook extends Document {
  user: mongoose.Types.ObjectId;
  book: mongoose.Types.ObjectId;
  notifyOnAvailable: boolean;
  isWaitingAvailability: boolean;
  lastAvailabilityNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteBookSchema = new Schema<IFavoriteBook>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc'],
      index: true
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Sách là bắt buộc'],
      index: true
    },
    notifyOnAvailable: {
      type: Boolean,
      default: true
    },
    isWaitingAvailability: {
      type: Boolean,
      default: false,
      index: true
    },
    lastAvailabilityNotifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound index để đảm bảo mỗi user chỉ có thể thêm một sách một lần
FavoriteBookSchema.index({ user: 1, book: 1 }, { unique: true });

// Index để tối ưu query theo user và createdAt (sắp xếp mới nhất trước)
FavoriteBookSchema.index({ user: 1, createdAt: -1 });
FavoriteBookSchema.index({ book: 1, isWaitingAvailability: 1 });

const FavoriteBook = mongoose.model<IFavoriteBook>('FavoriteBook', FavoriteBookSchema);

export default FavoriteBook;

