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
exports.EBOOK_REPORT_STATUSES = exports.EBOOK_REPORT_ISSUE_TYPES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.EBOOK_REPORT_ISSUE_TYPES = [
    'copyright',
    'formatting',
    'broken_link',
    'typo',
    'offensive',
    'other',
];
exports.EBOOK_REPORT_STATUSES = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];
const EbookContentReportSchema = new mongoose_1.Schema({
    reporter: {
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
    digitalFileId: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    issueType: {
        type: String,
        enum: exports.EBOOK_REPORT_ISSUE_TYPES,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 20,
        maxlength: 2000,
    },
    pageNumber: {
        type: Number,
        min: 1,
        max: 10000,
    },
    evidenceUrls: [
        {
            type: String,
            trim: true,
            maxlength: 500,
        },
    ],
    status: {
        type: String,
        enum: exports.EBOOK_REPORT_STATUSES,
        default: 'PENDING',
        index: true,
    },
    resolutionNotes: {
        type: String,
        trim: true,
        maxlength: 2000,
    },
    handledBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    handledAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
EbookContentReportSchema.index({ book: 1, status: 1 });
EbookContentReportSchema.index({ reporter: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('EbookContentReport', EbookContentReportSchema);
//# sourceMappingURL=EbookContentReport.js.map