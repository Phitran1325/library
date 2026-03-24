import mongoose, { Document, Schema } from 'mongoose';

export interface IBookCopy extends Document {
  bookId: mongoose.Types.ObjectId;
  barcode: string; // Mã vạch duy nhất cho mỗi bản sao
  status: 'available' | 'borrowed' | 'reserved' | 'maintenance' | 'lost' | 'damaged';
  location?: string; // Vị trí trên kệ (ví dụ: "Kệ A1-2-3")
  acquisitionDate?: Date; // Ngày nhập vào thư viện
  purchasePrice?: number; // Giá mua
  notes?: string; // Ghi chú về tình trạng, lịch sử, etc.
  condition: 'new' | 'good' | 'fair' | 'poor'; // Tình trạng sách
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookCopySchema = new Schema<IBookCopy>({
  bookId: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'ID sách là bắt buộc'],
    index: true
  },
  barcode: {
    type: String,
    required: [true, 'Mã vạch là bắt buộc'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]+$/, 'Mã vạch chỉ chứa chữ cái in hoa và số'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['available', 'borrowed', 'reserved', 'maintenance', 'lost', 'damaged'],
      message: 'Trạng thái không hợp lệ'
    },
    default: 'available',
    required: true,
    index: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Vị trí không được vượt quá 100 ký tự']
  },
  acquisitionDate: {
    type: Date,
    validate: {
      validator: function(date: Date) {
        return !date || date <= new Date();
      },
      message: 'Ngày nhập không thể là tương lai'
    }
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Giá mua không được âm'],
    max: [10000000, 'Giá mua không được vượt quá 10,000,000 VND']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
  },
  condition: {
    type: String,
    enum: {
      values: ['new', 'good', 'fair', 'poor'],
      message: 'Tình trạng sách không hợp lệ'
    },
    default: 'good',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
BookCopySchema.index({ bookId: 1, status: 1 });
BookCopySchema.index({ bookId: 1, isActive: 1 });
BookCopySchema.index({ status: 1, isActive: 1 });

// Virtual to populate book information
BookCopySchema.virtual('book', {
  ref: 'Book',
  localField: 'bookId',
  foreignField: '_id',
  justOne: true
});

const BookCopy = mongoose.model<IBookCopy>('BookCopy', BookCopySchema);

export default BookCopy;

