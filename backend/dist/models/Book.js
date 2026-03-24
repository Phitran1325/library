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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const Tag_1 = __importDefault(require("./Tag"));
// Helper function to generate slug
function generateSlug(title) {
    return title
        .toLowerCase()
        .normalize('NFD') // Normalize Vietnamese characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd') // Replace đ with d
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Trim hyphens from start and end
}
const BookSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Tên sách là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tên sách không được vượt quá 200 ký tự']
    },
    slug: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    isbn: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        match: [/^[0-9]{10,13}$/, 'ISBN phải có 10-13 chữ số']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Mô tả không được vượt quá 2000 ký tự']
    },
    coverImage: {
        type: String,
        trim: true
    },
    pages: {
        type: Number,
        min: [1, 'Số trang phải lớn hơn 0'],
        max: [10000, 'Số trang không được vượt quá 10000']
    },
    publicationYear: {
        type: Number,
        min: [1000, 'Năm xuất bản không hợp lệ'],
        max: [new Date().getFullYear() + 1, 'Năm xuất bản không thể là tương lai']
    },
    publishedDate: {
        type: Date,
        validate: {
            validator: function (date) {
                return !date || date <= new Date();
            },
            message: 'Ngày xuất bản không thể là tương lai'
        }
    },
    language: {
        type: String,
        required: [true, 'Ngôn ngữ là bắt buộc'],
        trim: true
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
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        sparse: true
    },
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Author',
        required: [true, 'Tác giả là bắt buộc']
    },
    publisherId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Publisher',
        required: [true, 'Nhà xuất bản là bắt buộc']
    },
    price: {
        type: Number,
        min: [0, 'Giá sách không được âm'],
        max: [10000000, 'Giá sách không được vượt quá 10,000,000 VND']
    },
    rentalPrice: {
        type: Number,
        required: [true, 'Phí thuê là bắt buộc'],
        min: [0, 'Phí thuê không được âm'],
        max: [1000000, 'Phí thuê không được vượt quá 1,000,000 VND']
    },
    discount: {
        type: Number,
        min: [0, 'Giảm giá không được âm'],
        max: [100, 'Giảm giá không được vượt quá 100%'],
        default: 0
    },
    stock: {
        type: Number,
        required: [true, 'Số lượng tồn kho là bắt buộc'],
        default: 0,
        min: [0, 'Số lượng tồn kho không được âm']
    },
    available: {
        type: Number,
        required: [true, 'Số lượng có sẵn là bắt buộc'],
        default: 0,
        min: [0, 'Số lượng có sẵn không được âm']
    },
    volume: {
        type: Number,
        min: [1, 'Số tập phải lớn hơn 0'],
        max: [1000, 'Số tập không được vượt quá 1000']
    },
    isNewRelease: {
        type: Boolean,
        default: false
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    digitalFiles: [
        {
            format: {
                type: String,
                enum: ['PDF', 'EPUB'],
                required: true,
            },
            publicId: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
            size: {
                type: Number,
                required: true,
                min: [0, 'Kích thước file phải lớn hơn 0'],
            },
            uploadedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    tags: [{
            type: String,
            trim: true,
            maxlength: [50, 'Tag không được vượt quá 50 ký tự'],
            validate: {
                validator: async function (tag) {
                    const existingTag = await Tag_1.default.findOne({ name: tag, isActive: true });
                    return !!existingTag;
                },
                message: 'Tag "{VALUE}" không tồn tại hoặc đã bị vô hiệu hóa'
            }
        }],
    rating: {
        type: Number,
        min: [0, 'Đánh giá không được dưới 0'],
        max: [5, 'Đánh giá không được vượt quá 5'],
        default: 0
    },
    reviewCount: {
        type: Number,
        min: [0, 'Số lượt đánh giá không được âm'],
        default: 0
    },
    status: {
        type: String,
        enum: {
            values: ['available', 'out_of_stock', 'discontinued'],
            message: 'Trạng thái không hợp lệ'
        },
        default: 'available'
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
// Indexes for better search performance
BookSchema.index({ title: 1 });
BookSchema.index({ category: 1 });
BookSchema.index({ authorId: 1 });
BookSchema.index({ publisherId: 1 });
BookSchema.index({ status: 1 });
BookSchema.index({ isActive: 1 });
BookSchema.index({ isNewRelease: 1 });
BookSchema.index({ isPremium: 1 });
BookSchema.index({ volume: 1 });
BookSchema.index({ publicationYear: 1 });
BookSchema.index({ publishedDate: 1 });
BookSchema.index({ rating: -1 });
BookSchema.index({ createdAt: -1 });
// Text search index with safe default language for VN (no stemming)
BookSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
}, {
    default_language: 'none',
    language_override: 'none'
});
// Virtual for borrow count
BookSchema.virtual('borrowCount', {
    ref: 'Borrow',
    localField: '_id',
    foreignField: 'book',
    count: true
});
// Virtual for total copies (alias for stock)
BookSchema.virtual('totalCopies').get(function () {
    return this.stock;
});
// Virtual for available copies (alias for available)
BookSchema.virtual('availableCopies').get(function () {
    return this.available;
});
// Pre-save middleware to auto-generate slug and ensure available <= stock
BookSchema.pre('save', async function (next) {
    // Ensure available <= stock
    if (this.available > this.stock) {
        this.available = this.stock;
    }
    // Auto-generate slug if not exists or title changed
    if (!this.slug || this.isModified('title')) {
        let baseSlug = generateSlug(this.title);
        let slug = baseSlug;
        let counter = 1;
        // Ensure unique slug
        while (await mongoose_1.default.model('Book').findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        this.slug = slug;
    }
    next();
});
const Book = mongoose_1.default.model('Book', BookSchema);
exports.default = Book;
//# sourceMappingURL=Book.js.map