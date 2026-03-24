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
const borrowSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người mượn là bắt buộc'],
        index: true
    },
    book: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'Sách là bắt buộc'],
        index: true
    },
    bookCopy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'BookCopy',
        index: true
    },
    borrowType: {
        type: String,
        enum: ['Membership', 'Rental'],
        required: true,
        default: 'Membership',
        index: true
    },
    borrowDate: {
        type: Date,
        // Required chỉ khi status !== 'Pending'
    },
    dueDate: {
        type: Date,
        // Required chỉ khi status !== 'Pending'
    },
    returnDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'Borrowed', 'Returned', 'Overdue', 'Lost', 'Damaged', 'Cancelled', 'ReturnRequested'],
        default: 'Pending',
        index: true
    },
    renewalCount: {
        type: Number,
        default: 0,
        min: [0, 'Số lần gia hạn không được âm']
    },
    maxRenewals: {
        type: Number,
        required: true,
        min: [0, 'Số lần gia hạn tối đa không được âm'],
        default: 1
    },
    lateFee: {
        type: Number,
        default: 0,
        min: [0, 'Phí phạt trễ hạn không được âm']
    },
    damageFee: {
        type: Number,
        default: 0,
        min: [0, 'Phí hư hỏng không được âm']
    },
    rentalDays: {
        type: Number,
        min: 1,
        max: 7
    },
    rentalPricePerDay: {
        type: Number,
        min: 0
    },
    totalRentalPrice: {
        type: Number,
        min: 0
    },
    paymentId: {
        type: String,
        trim: true,
        index: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
    },
    processedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }
}, { timestamps: true });
// Compound indexes
borrowSchema.index({ user: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });
borrowSchema.index({ dueDate: 1, status: 1 });
borrowSchema.index({ user: 1, book: 1, status: 1 });
borrowSchema.index({ bookCopy: 1, status: 1 });
borrowSchema.index({ user: 1, borrowType: 1, borrowDate: 1 });
borrowSchema.index({ processedBy: 1, status: 1 });
borrowSchema.index({ processedBy: 1, createdAt: 1 });
// Virtual để tính số ngày trễ
borrowSchema.virtual('daysLate').get(function () {
    if (this.status === 'Returned' && this.returnDate) {
        return Math.max(0, Math.floor((this.returnDate.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    }
    if (this.status === 'Borrowed' || this.status === 'Overdue') {
        return Math.max(0, Math.floor((Date.now() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return 0;
});
// Pre-save middleware: tự động chuyển sang Overdue nếu quá hạn
borrowSchema.pre('save', function (next) {
    if (this.status === 'Borrowed' && this.dueDate < new Date() && !this.returnDate) {
        this.status = 'Overdue';
    }
    next();
});
// Method: kiểm tra có thể gia hạn không
borrowSchema.methods.canRenew = function () {
    return (this.status === 'Borrowed' &&
        this.renewalCount < this.maxRenewals &&
        this.dueDate >= new Date());
};
exports.default = mongoose_1.default.model('Borrow', borrowSchema);
//# sourceMappingURL=Borrow.js.map