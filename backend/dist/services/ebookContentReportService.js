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
exports.updateEbookContentReport = exports.getEbookContentReportById = exports.listMyContentReports = exports.listEbookContentReports = exports.submitEbookContentReport = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const EbookAccess_1 = __importDefault(require("../models/EbookAccess"));
const Book_1 = __importDefault(require("../models/Book"));
const EbookContentReport_1 = __importStar(require("../models/EbookContentReport"));
const ACTIVE_ACCESS_STATUS = 'ACTIVE';
const MAX_EVIDENCE_URLS = 5;
const ensureObjectId = (value, field) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
        throw new Error(`${field} không hợp lệ`);
    }
    return new mongoose_1.default.Types.ObjectId(value);
};
const buildActiveAccessQuery = (userId, bookId) => ({
    user: ensureObjectId(userId, 'userId'),
    book: ensureObjectId(bookId, 'bookId'),
    status: ACTIVE_ACCESS_STATUS,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
});
const normalizeEvidenceUrls = (urls) => {
    if (!Array.isArray(urls)) {
        return [];
    }
    const isValidUrl = (value) => /^https?:\/\/.{3,}$/i.test(value.trim());
    return urls
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value.length <= 500 && isValidUrl(value))
        .slice(0, MAX_EVIDENCE_URLS);
};
const validateIssueType = (issueType) => {
    if (!EbookContentReport_1.EBOOK_REPORT_ISSUE_TYPES.includes(issueType)) {
        throw new Error('Loại vấn đề không hợp lệ');
    }
};
const validateStatus = (status) => {
    if (!EbookContentReport_1.EBOOK_REPORT_STATUSES.includes(status)) {
        throw new Error('Trạng thái báo cáo không hợp lệ');
    }
};
const ensureBookAndFile = async (bookId, digitalFileId) => {
    const book = await Book_1.default.findById(bookId).select('title digitalFiles isActive status').lean();
    if (!book) {
        throw new Error('Không tìm thấy sách');
    }
    if (!book.digitalFiles || book.digitalFiles.length === 0) {
        throw new Error('Sách chưa có file ebook để báo cáo');
    }
    if (!digitalFileId) {
        return { book };
    }
    const match = book.digitalFiles.find((file) => file._id?.toString() === digitalFileId.toString());
    if (!match) {
        throw new Error('File ebook không thuộc về sách này');
    }
    return { book, digitalFile: match };
};
const ensureActiveAccess = async (userId, bookId) => {
    const access = await EbookAccess_1.default.findOne(buildActiveAccessQuery(userId, bookId)).lean();
    if (!access) {
        throw new Error('Bạn chưa có quyền đọc ebook này hoặc quyền đã hết hạn');
    }
};
const submitEbookContentReport = async (params) => {
    const { reporterId, bookId, digitalFileId, issueType, description, pageNumber, evidenceUrls } = params;
    if (!description || description.trim().length < 20) {
        throw new Error('Mô tả phải có ít nhất 20 ký tự');
    }
    if (description.trim().length > 2000) {
        throw new Error('Mô tả không được vượt quá 2000 ký tự');
    }
    if (typeof pageNumber === 'number') {
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 10000) {
            throw new Error('Số trang không hợp lệ');
        }
    }
    validateIssueType(issueType);
    await ensureActiveAccess(reporterId, bookId);
    await ensureBookAndFile(bookId, digitalFileId);
    const report = await EbookContentReport_1.default.create({
        reporter: ensureObjectId(reporterId, 'reporterId'),
        book: ensureObjectId(bookId, 'bookId'),
        digitalFileId: digitalFileId ? ensureObjectId(digitalFileId, 'fileId') : undefined,
        issueType,
        description: description.trim(),
        pageNumber,
        evidenceUrls: normalizeEvidenceUrls(evidenceUrls),
    });
    await report.populate([
        { path: 'book', select: 'title coverImage' },
        { path: 'reporter', select: 'fullName email' },
        { path: 'handledBy', select: 'fullName email' },
    ]);
    return report;
};
exports.submitEbookContentReport = submitEbookContentReport;
const listEbookContentReports = async (params) => {
    const { page = 1, limit = 20, status, issueType, bookId, reporterId, search } = params;
    const query = {};
    if (status) {
        validateStatus(status);
        query.status = status;
    }
    if (issueType) {
        validateIssueType(issueType);
        query.issueType = issueType;
    }
    if (bookId) {
        query.book = ensureObjectId(bookId, 'bookId');
    }
    if (reporterId) {
        query.reporter = ensureObjectId(reporterId, 'reporterId');
    }
    if (search) {
        query.description = { $regex: search, $options: 'i' };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
        EbookContentReport_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('book', 'title coverImage')
            .populate('reporter', 'fullName email')
            .populate('handledBy', 'fullName email')
            .lean(),
        EbookContentReport_1.default.countDocuments(query),
    ]);
    return {
        items,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)) || 0,
        },
    };
};
exports.listEbookContentReports = listEbookContentReports;
const listMyContentReports = async (reporterId, params) => {
    return (0, exports.listEbookContentReports)({
        ...params,
        reporterId,
    });
};
exports.listMyContentReports = listMyContentReports;
const getEbookContentReportById = async (id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new Error('ID báo cáo không hợp lệ');
    }
    const report = await EbookContentReport_1.default.findById(id)
        .populate('book', 'title coverImage')
        .populate('reporter', 'fullName email')
        .populate('handledBy', 'fullName email');
    if (!report) {
        throw new Error('Không tìm thấy báo cáo');
    }
    return report;
};
exports.getEbookContentReportById = getEbookContentReportById;
const updateEbookContentReport = async (params) => {
    const { id, handledBy, status, resolutionNotes } = params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new Error('ID báo cáo không hợp lệ');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(handledBy)) {
        throw new Error('Người xử lý không hợp lệ');
    }
    if (!status && typeof resolutionNotes !== 'string') {
        throw new Error('Vui lòng cung cấp trạng thái hoặc ghi chú xử lý');
    }
    if (status) {
        validateStatus(status);
    }
    const update = {
        $set: {},
        $unset: {},
    };
    if (status) {
        update.$set.status = status;
        if (status === 'PENDING') {
            update.$unset.handledBy = '';
            update.$unset.handledAt = '';
            update.$unset.resolutionNotes = '';
        }
        else {
            update.$set.handledBy = ensureObjectId(handledBy, 'handledBy');
            update.$set.handledAt = new Date();
        }
        if ((status === 'RESOLVED' || status === 'DISMISSED') && !resolutionNotes?.trim()) {
            throw new Error('Cần có ghi chú khi đóng báo cáo');
        }
    }
    if (typeof resolutionNotes === 'string') {
        if (resolutionNotes.length > 2000) {
            throw new Error('Ghi chú không được vượt quá 2000 ký tự');
        }
        update.$set.resolutionNotes = resolutionNotes.trim();
    }
    if (Object.keys(update.$unset).length === 0) {
        delete update.$unset;
    }
    if (Object.keys(update.$set).length === 0) {
        delete update.$set;
    }
    const report = await EbookContentReport_1.default.findByIdAndUpdate(id, update, { new: true })
        .populate('book', 'title coverImage')
        .populate('reporter', 'fullName email')
        .populate('handledBy', 'fullName email');
    if (!report) {
        throw new Error('Không tìm thấy báo cáo để cập nhật');
    }
    return report;
};
exports.updateEbookContentReport = updateEbookContentReport;
//# sourceMappingURL=ebookContentReportService.js.map