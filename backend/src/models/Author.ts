import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthor extends Document {
  name: string;
  biography?: string;
  birthDate?: Date;
  nationality?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AuthorSchema = new Schema<IAuthor>({
  name: {
    type: String,
    required: [true, 'Tên tác giả là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên tác giả không được vượt quá 100 ký tự']
  },
  biography: {
    type: String,
    trim: true,
    maxlength: [1000, 'Tiểu sử không được vượt quá 1000 ký tự']
  },
  birthDate: {
    type: Date,
    validate: {
      validator: function(this: IAuthor, value: Date) {
        return !value || value <= new Date();
      },
      message: 'Ngày sinh không thể là ngày trong tương lai'
    }
  },
  nationality: {
    type: String,
    trim: true,
    maxlength: [50, 'Quốc tịch không được vượt quá 50 ký tự']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Website phải bắt đầu bằng http:// hoặc https://']
  },
  socialMedia: {
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?facebook\.com\/.+/, 'Facebook URL không hợp lệ']
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?twitter\.com\/.+/, 'Twitter URL không hợp lệ']
    },
    instagram: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?instagram\.com\/.+/, 'Instagram URL không hợp lệ']
    },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/, 'LinkedIn URL không hợp lệ']
    }
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
AuthorSchema.index({ isActive: 1 });
AuthorSchema.index({ createdAt: -1 });
AuthorSchema.index({ nationality: 1 });

// Virtual for book count
AuthorSchema.virtual('bookCount', {
  ref: 'Book',
  localField: '_id',
  foreignField: 'authorId',
  count: true
});

// Ensure unique name
AuthorSchema.index({ name: 1 }, { unique: true });

const Author = mongoose.model<IAuthor>('Author', AuthorSchema);

export default Author;
