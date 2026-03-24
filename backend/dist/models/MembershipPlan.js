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
const membershipPlanSchema = new mongoose_1.Schema({
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
const MembershipPlan = mongoose_1.default.model('MembershipPlan', membershipPlanSchema);
exports.default = MembershipPlan;
//# sourceMappingURL=MembershipPlan.js.map