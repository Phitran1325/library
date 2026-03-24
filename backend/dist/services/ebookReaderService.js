"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveReadingProgress = exports.getReadUrlForFile = exports.getReadableBookDetail = exports.listReadableBooks = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const EbookAccess_1 = __importDefault(require("../models/EbookAccess"));
const Book_1 = __importDefault(require("../models/Book"));
const EbookReadingProgress_1 = __importDefault(require("../models/EbookReadingProgress"));
const uploadService_1 = require("./uploadService");
const ACTIVE_STATUS = 'ACTIVE';
const DEFAULT_READ_TTL = Number(process.env.EBOOK_READ_TTL || 180);
const ensureObjectId = (value, field) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
        throw new Error(`${field} không hợp lệ`);
    }
    return new mongoose_1.default.Types.ObjectId(value);
};
const buildActiveAccessQuery = (userId, bookId) => {
    const query = {
        user: ensureObjectId(userId, 'userId'),
        status: ACTIVE_STATUS,
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
        ],
    };
    if (bookId) {
        query.book = ensureObjectId(bookId, 'bookId');
    }
    return query;
};
const listReadableBooks = async (userId, params) => {
    const { page = 1, limit = 12, search } = params;
    const skip = (Number(page) - 1) * Number(limit);
    const baseMatch = buildActiveAccessQuery(userId);
    const pipeline = [
        { $match: baseMatch },
        {
            $lookup: {
                from: 'books',
                localField: 'book',
                foreignField: '_id',
                as: 'book',
            },
        },
        { $unwind: '$book' },
        {
            $match: {
                'book.isActive': true,
                'book.status': 'available',
                'book.digitalFiles.0': { $exists: true },
            },
        },
    ];
    if (search) {
        pipeline.push({
            $match: {
                'book.title': { $regex: search, $options: 'i' },
            },
        });
    }
    pipeline.push({ $sort: { updatedAt: -1 } });
    const aggregated = await EbookAccess_1.default.aggregate([
        ...pipeline,
        {
            $facet: {
                items: [
                    { $skip: skip },
                    { $limit: Number(limit) },
                    {
                        $lookup: {
                            from: 'ebookReadingProgresses',
                            let: { userId: '$user', bookId: '$book._id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$user', '$$userId'] },
                                                { $eq: ['$book', '$$bookId'] },
                                            ],
                                        },
                                    },
                                },
                                { $sort: { updatedAt: -1 } },
                                { $limit: 1 },
                            ],
                            as: 'latestProgress',
                        },
                    },
                    {
                        $project: {
                            accessId: '$_id',
                            bookId: '$book._id',
                            title: '$book.title',
                            coverImage: '$book.coverImage',
                            authorId: '$book.authorId',
                            expiresAt: '$expiresAt',
                            grantedAt: '$createdAt',
                            updatedAt: '$updatedAt',
                            progress: { $arrayElemAt: ['$latestProgress', 0] },
                        },
                    },
                ],
                total: [{ $count: 'count' }],
            },
        },
    ]);
    const items = aggregated?.[0]?.items || [];
    const total = aggregated?.[0]?.total?.[0]?.count || 0;
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
exports.listReadableBooks = listReadableBooks;
const ensureActiveAccess = async (userId, bookId) => {
    const access = await EbookAccess_1.default.findOne(buildActiveAccessQuery(userId, bookId));
    if (!access) {
        throw new Error('Bạn chưa được cấp quyền đọc ebook này hoặc quyền đã hết hạn');
    }
    return access;
};
const getReadableBookDetail = async (userId, bookId) => {
    await ensureActiveAccess(userId, bookId);
    const book = await Book_1.default.findById(bookId)
        .select('title coverImage authorId publisherId digitalFiles description isPremium')
        .populate('authorId', 'name')
        .populate('publisherId', 'name')
        .lean();
    if (!book || !book.digitalFiles || book.digitalFiles.length === 0) {
        throw new Error('Sách không tồn tại hoặc chưa có file ebook');
    }
    const progresses = await EbookReadingProgress_1.default.find({
        user: userId,
        book: bookId,
    })
        .select('fileId percentage currentPage totalPages lastLocation lastOpenedAt')
        .lean();
    const progressMap = new Map(progresses.map((progress) => [progress.fileId.toString(), progress]));
    const files = book.digitalFiles.map((file) => ({
        id: file._id,
        format: file.format,
        size: file.size,
        uploadedAt: file.uploadedAt,
        hasProgress: progressMap.has(file._id.toString()),
        progress: progressMap.get(file._id.toString()) || null,
    }));
    return {
        book: {
            id: book._id,
            title: book.title,
            coverImage: book.coverImage,
            author: book.authorId,
            publisher: book.publisherId,
            isPremium: book.isPremium,
            description: book.description,
        },
        files,
    };
};
exports.getReadableBookDetail = getReadableBookDetail;
const getReadUrlForFile = async (params) => {
    const { userId, bookId, fileId, ttlSeconds } = params;
    await ensureActiveAccess(userId, bookId);
    const book = await Book_1.default.findById(bookId).select('title digitalFiles').lean();
    if (!book || !book.digitalFiles || book.digitalFiles.length === 0) {
        throw new Error('Sách không tồn tại hoặc chưa có file ebook');
    }
    const digitalFile = book.digitalFiles.find((file) => file._id?.toString() === fileId.toString());
    if (!digitalFile) {
        throw new Error('Không tìm thấy ebook yêu cầu');
    }
    const ttl = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : DEFAULT_READ_TTL;
    const downloadInfo = (0, uploadService_1.generateEbookDownloadUrl)(digitalFile.publicId, digitalFile.format || 'pdf', ttl);
    await EbookReadingProgress_1.default.findOneAndUpdate({
        user: ensureObjectId(userId, 'userId'),
        book: ensureObjectId(bookId, 'bookId'),
        fileId: ensureObjectId(fileId, 'fileId'),
    }, {
        $setOnInsert: {
            user: ensureObjectId(userId, 'userId'),
            book: ensureObjectId(bookId, 'bookId'),
            fileId: ensureObjectId(fileId, 'fileId'),
        },
        $set: {
            lastOpenedAt: new Date(),
        },
    }, { upsert: true });
    return {
        url: downloadInfo.url,
        expiresIn: downloadInfo.expiresIn,
        expiresAt: downloadInfo.expiresAt,
        format: digitalFile.format,
        fileId: digitalFile._id,
        book: {
            id: book._id,
            title: book.title,
        },
    };
};
exports.getReadUrlForFile = getReadUrlForFile;
const clampPercentage = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return undefined;
    }
    return Math.max(0, Math.min(100, Number(value)));
};
const saveReadingProgress = async (params) => {
    const { userId, bookId, fileId, percentage, currentPage, totalPages, lastLocation, deviceInfo } = params;
    await ensureActiveAccess(userId, bookId);
    const updatePayload = {
        lastOpenedAt: new Date(),
    };
    const clampedPercentage = clampPercentage(percentage);
    if (typeof clampedPercentage === 'number') {
        updatePayload.percentage = clampedPercentage;
    }
    if (typeof currentPage === 'number') {
        updatePayload.currentPage = currentPage;
    }
    if (typeof totalPages === 'number' && totalPages > 0) {
        updatePayload.totalPages = totalPages;
    }
    if (typeof lastLocation === 'string') {
        updatePayload.lastLocation = lastLocation;
    }
    if (deviceInfo) {
        updatePayload.deviceInfo = deviceInfo;
    }
    const progress = await EbookReadingProgress_1.default.findOneAndUpdate({
        user: ensureObjectId(userId, 'userId'),
        book: ensureObjectId(bookId, 'bookId'),
        fileId: ensureObjectId(fileId, 'fileId'),
    }, {
        $setOnInsert: {
            user: ensureObjectId(userId, 'userId'),
            book: ensureObjectId(bookId, 'bookId'),
            fileId: ensureObjectId(fileId, 'fileId'),
        },
        $set: updatePayload,
    }, {
        new: true,
        upsert: true,
    }).select('percentage currentPage totalPages lastLocation lastOpenedAt deviceInfo fileId');
    return progress;
};
exports.saveReadingProgress = saveReadingProgress;
//# sourceMappingURL=ebookReaderService.js.map