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
const borrowReminderSchema = new mongoose_1.Schema({
    borrow: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Borrow',
        required: [true, 'Phiếu mượn là bắt buộc'],
        index: true
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người dùng là bắt buộc'],
        index: true
    },
    type: {
        type: String,
        enum: ['BEFORE_DUE', 'OVERDUE', 'MANUAL'],
        required: [true, 'Loại nhắc nhở là bắt buộc'],
        index: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED'],
        default: 'PENDING',
        index: true
    },
    scheduledDate: {
        type: Date,
        required: [true, 'Ngày dự kiến gửi là bắt buộc'],
        index: true
    },
    sentAt: {
        type: Date
    },
    daysUntilDue: {
        type: Number,
        min: [0, 'Số ngày còn lại không được âm']
    },
    daysOverdue: {
        type: Number,
        min: [0, 'Số ngày quá hạn không được âm']
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    websocketSent: {
        type: Boolean,
        default: false
    },
    errorMessage: {
        type: String,
        maxlength: [500, 'Thông báo lỗi không được vượt quá 500 ký tự']
    },
    retryCount: {
        type: Number,
        default: 0,
        min: [0, 'Số lần thử lại không được âm']
    },
    maxRetries: {
        type: Number,
        default: 3,
        min: [0, 'Số lần thử lại tối đa không được âm'],
        max: [10, 'Số lần thử lại tối đa không được vượt quá 10']
    }
}, {
    timestamps: true
});
// Compound indexes để tối ưu query
borrowReminderSchema.index({ borrow: 1, type: 1, status: 1 });
borrowReminderSchema.index({ user: 1, status: 1, scheduledDate: 1 });
borrowReminderSchema.index({ scheduledDate: 1, status: 1 });
borrowReminderSchema.index({ type: 1, status: 1, scheduledDate: 1 });
// Index để tìm reminders cần gửi
borrowReminderSchema.index({ status: 1, scheduledDate: 1, type: 1 });
// Unique index để tránh gửi duplicate reminders cùng loại cho cùng một borrow
borrowReminderSchema.index({ borrow: 1, type: 1, scheduledDate: 1 }, {
    unique: true,
    partialFilterExpression: { status: { $in: ['PENDING', 'SENT'] } }
});
const BorrowReminder = mongoose_1.default.model('BorrowReminder', borrowReminderSchema);
exports.default = BorrowReminder;
//# sourceMappingURL=BorrowReminder.js.map