"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    phoneNumber: String,
    address: String,
    avatar: String,
    role: { type: String, enum: ['Admin', 'Librarian', 'Reader'], default: 'Reader' },
    membershipPlanId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'MembershipPlan' },
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
}, { timestamps: true });
exports.default = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map