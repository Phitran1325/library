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
const EbookReadingProgressSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    book: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
        index: true,
    },
    fileId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    currentPage: {
        type: Number,
        min: 0,
    },
    totalPages: {
        type: Number,
        min: 1,
    },
    lastLocation: {
        type: String,
        trim: true,
    },
    lastOpenedAt: {
        type: Date,
    },
    deviceInfo: {
        platform: { type: String, trim: true },
        browser: { type: String, trim: true },
        appVersion: { type: String, trim: true },
    },
}, {
    timestamps: true,
    collection: 'ebookReadingProgresses',
});
EbookReadingProgressSchema.index({ user: 1, book: 1, fileId: 1 }, { unique: true });
exports.default = mongoose_1.default.model('EbookReadingProgress', EbookReadingProgressSchema);
//# sourceMappingURL=EbookReadingProgress.js.map