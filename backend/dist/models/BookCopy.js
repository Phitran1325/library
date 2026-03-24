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
const BookCopySchema = new mongoose_1.Schema({
    bookId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'ID sách là bắt buộc'],
        index: true
    },
    barcode: {
        type: String,
        required: [true, 'Mã vạch là bắt buộc'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9]+$/, 'Mã vạch chỉ chứa chữ cái in hoa và số'],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['available', 'borrowed', 'reserved', 'maintenance', 'lost', 'damaged'],
            message: 'Trạng thái không hợp lệ'
        },
        default: 'available',
        required: true,
        index: true
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Vị trí không được vượt quá 100 ký tự']
    },
    acquisitionDate: {
        type: Date,
        validate: {
            validator: function (date) {
                return !date || date <= new Date();
            },
            message: 'Ngày nhập không thể là tương lai'
        }
    },
    purchasePrice: {
        type: Number,
        min: [0, 'Giá mua không được âm'],
        max: [10000000, 'Giá mua không được vượt quá 10,000,000 VND']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
    },
    condition: {
        type: String,
        enum: {
            values: ['new', 'good', 'fair', 'poor'],
            message: 'Tình trạng sách không hợp lệ'
        },
        default: 'good',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes for better query performance
BookCopySchema.index({ bookId: 1, status: 1 });
BookCopySchema.index({ bookId: 1, isActive: 1 });
BookCopySchema.index({ status: 1, isActive: 1 });
// Virtual to populate book information
BookCopySchema.virtual('book', {
    ref: 'Book',
    localField: 'bookId',
    foreignField: '_id',
    justOne: true
});
const BookCopy = mongoose_1.default.model('BookCopy', BookCopySchema);
exports.default = BookCopy;
//# sourceMappingURL=BookCopy.js.map