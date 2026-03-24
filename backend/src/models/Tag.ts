import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  name: string;
  category: string;
  isActive: boolean;
  bookCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: [true, 'Tên tag là bắt buộc'],
    unique: true,
    trim: true,
    maxlength: [50, 'Tên tag không được vượt quá 50 ký tự']
  },
  category: {
    type: String,
    required: [true, 'Thể loại là bắt buộc'],
    enum: {
      values: [
        'Văn học',
        'Khoa học - Công nghệ',
        'Lịch sử - Địa lý',
        'Kinh tế - Kinh doanh',
        'Giáo dục - Đào tạo',
        'Y học - Sức khỏe',
        'Nghệ thuật - Thẩm mỹ',
        'Tôn giáo - Triết học',
        'Thiếu nhi - Thanh thiếu niên',
        'Thể thao - Giải trí'
      ],
      message: 'Thể loại phải là một trong 10 thể loại được phép'
    },
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bookCount: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng sách không được âm']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TagSchema.index({ category: 1 });
TagSchema.index({ isActive: 1 });
TagSchema.index({ bookCount: -1 });

const Tag = mongoose.model<ITag>('Tag', TagSchema);

export default Tag;
