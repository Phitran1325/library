import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
  googleId?: string; // Added for Google authentication
  role: 'Admin' | 'Librarian' | 'Reader';
  membershipPlanId?: mongoose.Types.ObjectId;
  membershipStartDate?: Date;
  membershipEndDate?: Date;
  totalSpent: number;
  debt: number;
  debtLastUpdated?: Date;
  canBorrow: boolean;
  status: 'Active' | 'Suspended' | 'Banned';
  isActive: boolean;
  violationCount: number;
  suspendedUntil?: Date;
  suspensionReason?: string;
  otpCode?: string;
  otpExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  notificationPreferences?: {
    channels: {
      email: {
        enabled: boolean;
      };
      inApp: {
        enabled: boolean;
      };
    };
    types: {
      system: boolean;
      borrowReminder: boolean;
      overdueWarning: boolean;
      favorite: boolean;
    };
  };
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: false }, // Made optional for Google users
    fullName: { type: String, required: true },
    phoneNumber: String,
    address: String,
    avatar: String,
    googleId: { type: String, unique: true, sparse: true }, // Added for Google authentication
    role: { type: String, enum: ['Admin', 'Librarian', 'Reader'], default: 'Reader' },
    membershipPlanId: { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
    membershipStartDate: Date,
    membershipEndDate: Date,
    totalSpent: { type: Number, default: 0, min: [0, 'Tổng chi tiêu không được âm'] },
    debt: { type: Number, default: 0, min: [0, 'Nợ không được âm'] },
    debtLastUpdated: Date,
    canBorrow: { type: Boolean, default: true },
    status: { type: String, enum: ['Active', 'Suspended', 'Banned'], default: 'Active' },
    isActive: { type: Boolean, default: true },
    violationCount: { type: Number, default: 0, min: [0, 'Số lần vi phạm không được âm'] },
    suspendedUntil: Date,
    suspensionReason: String,
    otpCode: String,
    otpExpiry: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,
    lastLoginAt: Date,
    notificationPreferences: {
      channels: {
        email: {
          enabled: { type: Boolean, default: true }
        },
        inApp: {
          enabled: { type: Boolean, default: true }
        }
      },
      types: {
        system: { type: Boolean, default: true },
        borrowReminder: { type: Boolean, default: true },
        overdueWarning: { type: Boolean, default: true },
        favorite: { type: Boolean, default: true }
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);