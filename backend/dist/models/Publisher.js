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
const PublisherSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Tên nhà xuất bản là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên nhà xuất bản không được vượt quá 100 ký tự']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Website phải bắt đầu bằng http:// hoặc https://']
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
PublisherSchema.index({ isActive: 1 });
PublisherSchema.index({ createdAt: -1 });
// Virtual for book count
PublisherSchema.virtual('bookCount', {
    ref: 'Book',
    localField: '_id',
    foreignField: 'publisherId',
    count: true
});
// Ensure unique name
PublisherSchema.index({ name: 1 }, { unique: true });
const Publisher = mongoose_1.default.model('Publisher', PublisherSchema);
exports.default = Publisher;
//# sourceMappingURL=Publisher.js.map