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
const TagSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Tên tag là bắt buộc'],
        unique: true,
        trim: true,
        maxlength: [50, 'Tên tag không được vượt quá 50 ký tự']
    },
    category: {
        type: String,
        required: [true, 'Thể loại là bắt buộc'],
        enum: {
            values: [
                'Văn học',
                'Khoa học - Công nghệ',
                'Lịch sử - Địa lý',
                'Kinh tế - Kinh doanh',
                'Giáo dục - Đào tạo',
                'Y học - Sức khỏe',
                'Nghệ thuật - Thẩm mỹ',
                'Tôn giáo - Triết học',
                'Thiếu nhi - Thanh thiếu niên',
                'Thể thao - Giải trí'
            ],
            message: 'Thể loại phải là một trong 10 thể loại được phép'
        },
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    bookCount: {
        type: Number,
        default: 0,
        min: [0, 'Số lượng sách không được âm']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes
TagSchema.index({ category: 1 });
TagSchema.index({ isActive: 1 });
TagSchema.index({ bookCount: -1 });
const Tag = mongoose_1.default.model('Tag', TagSchema);
exports.default = Tag;
//# sourceMappingURL=Tag.js.map