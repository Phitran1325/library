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
const AuthorSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Tên tác giả là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên tác giả không được vượt quá 100 ký tự']
    },
    biography: {
        type: String,
        trim: true,
        maxlength: [1000, 'Tiểu sử không được vượt quá 1000 ký tự']
    },
    birthDate: {
        type: Date,
        validate: {
            validator: function (value) {
                return !value || value <= new Date();
            },
            message: 'Ngày sinh không thể là ngày trong tương lai'
        }
    },
    nationality: {
        type: String,
        trim: true,
        maxlength: [50, 'Quốc tịch không được vượt quá 50 ký tự']
    },
    website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Website phải bắt đầu bằng http:// hoặc https://']
    },
    socialMedia: {
        facebook: {
            type: String,
            trim: true,
            match: [/^https?:\/\/(www\.)?facebook\.com\/.+/, 'Facebook URL không hợp lệ']
        },
        twitter: {
            type: String,
            trim: true,
            match: [/^https?:\/\/(www\.)?twitter\.com\/.+/, 'Twitter URL không hợp lệ']
        },
        instagram: {
            type: String,
            trim: true,
            match: [/^https?:\/\/(www\.)?instagram\.com\/.+/, 'Instagram URL không hợp lệ']
        },
        linkedin: {
            type: String,
            trim: true,
            match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/, 'LinkedIn URL không hợp lệ']
        }
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
AuthorSchema.index({ isActive: 1 });
AuthorSchema.index({ createdAt: -1 });
AuthorSchema.index({ nationality: 1 });
// Virtual for book count
AuthorSchema.virtual('bookCount', {
    ref: 'Book',
    localField: '_id',
    foreignField: 'authorId',
    count: true
});
// Ensure unique name
AuthorSchema.index({ name: 1 }, { unique: true });
const Author = mongoose_1.default.model('Author', AuthorSchema);
exports.default = Author;
//# sourceMappingURL=Author.js.map