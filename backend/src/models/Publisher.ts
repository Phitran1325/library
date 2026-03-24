import mongoose, { Document, Schema } from 'mongoose';

export interface IPublisher extends Document {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PublisherSchema = new Schema<IPublisher>({
  name: {
    type: String,
    required: [true, 'Tên nhà xuất bản là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên nhà xuất bản không được vượt quá 100 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Website phải bắt đầu bằng http:// hoặc https://']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better search performance
PublisherSchema.index({ isActive: 1 });
PublisherSchema.index({ createdAt: -1 });

// Virtual for book count
PublisherSchema.virtual('bookCount', {
  ref: 'Book',
  localField: '_id',
  foreignField: 'publisherId',
  count: true
});

// Ensure unique name
PublisherSchema.index({ name: 1 }, { unique: true });

const Publisher = mongoose.model<IPublisher>('Publisher', PublisherSchema);

export default Publisher;
