import mongoose, { Document, Schema } from 'mongoose';

export interface IMembershipPlan extends Document {
  name: string;
  description: string;
  price: number;
  duration: number; // số tháng
  maxBorrows: number; // số lượt mượn tối đa
  maxConcurrentBorrows: number; // số sách mượn đồng thời tối đa
  discountRate: number; // % giảm giá
  features: string[]; // các tính năng đặc biệt
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const membershipPlanSchema = new Schema<IMembershipPlan>({
  name: {
    type: String,
    required: [true, 'Tên gói thành viên là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên gói thành viên không được vượt quá 100 ký tự']
  },
  description: {
    type: String,
    required: [true, 'Mô tả gói thành viên là bắt buộc'],
    trim: true,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  price: {
    type: Number,
    required: [true, 'Giá gói thành viên là bắt buộc'],
    min: [0, 'Giá gói thành viên không được âm']
  },
  duration: {
    type: Number,
    required: [true, 'Thời hạn gói thành viên là bắt buộc'],
    min: [1, 'Thời hạn phải ít nhất 1 tháng'],
    max: [120, 'Thời hạn không được vượt quá 120 tháng']
  },
  maxBorrows: {
    type: Number,
    required: [true, 'Số lượt mượn tối đa là bắt buộc'],
    min: [0, 'Số lượt mượn tối đa không được âm'],
    default: 0 // 0 = không giới hạn
  },
  maxConcurrentBorrows: {
    type: Number,
    required: [true, 'Số sách mượn đồng thời tối đa là bắt buộc'],
    min: [1, 'Số sách mượn đồng thời tối đa phải ít nhất 1'],
    default: 5
  },
  discountRate: {
    type: Number,
    min: [0, 'Tỷ lệ giảm giá không được âm'],
    max: [100, 'Tỷ lệ giảm giá không được vượt quá 100%'],
    default: 0
  },
  features: [{
    type: String,
    trim: true,
    maxlength: [100, 'Tính năng không được vượt quá 100 ký tự']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
membershipPlanSchema.index({ name: 1 });
membershipPlanSchema.index({ isActive: 1 });
membershipPlanSchema.index({ price: 1 });

const MembershipPlan = mongoose.model<IMembershipPlan>('MembershipPlan', membershipPlanSchema);

export default MembershipPlan;
