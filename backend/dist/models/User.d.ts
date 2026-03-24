import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    username: string;
    passwordHash: string;
    fullName: string;
    phoneNumber?: string;
    address?: string;
    avatar?: string;
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
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map