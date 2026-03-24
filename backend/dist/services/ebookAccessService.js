"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.grantEbookAccess = grantEbookAccess;
exports.updateEbookAccess = updateEbookAccess;
exports.revokeEbookAccess = revokeEbookAccess;
exports.listEbookAccess = listEbookAccess;
exports.getActiveEbookAccessByUser = getActiveEbookAccessByUser;
exports.expireEbookAccesses = expireEbookAccesses;
const mongoose_1 = __importDefault(require("mongoose"));
const EbookAccess_1 = __importDefault(require("../models/EbookAccess"));
const Book_1 = __importDefault(require("../models/Book"));
const User_1 = __importDefault(require("../models/User"));
const ACTIVE_STATUS = 'ACTIVE';
async function grantEbookAccess(params) {
    const { userId, bookId, accessLevel = 'full', expiresAt, grantedBy, notes } = params;
    if (!mongoose_1.default.Types.ObjectId.isValid(userId) || !mongoose_1.default.Types.ObjectId.isValid(bookId)) {
        throw new Error('userId hoặc bookId không hợp lệ');
    }
    const [userExists, book] = await Promise.all([
        User_1.default.exists({ _id: userId }),
        Book_1.default.findById(bookId).select('digitalFiles title'),
    ]);
    if (!userExists) {
        throw new Error('Không tìm thấy người dùng');
    }
    if (!book) {
        throw new Error('Không tìm thấy sách');
    }
    if (!book.digitalFiles || book.digitalFiles.length === 0) {
        throw new Error('Sách chưa có file ebook để cấp quyền');
    }
    const updatePayload = {
        accessLevel,
        status: ACTIVE_STATUS,
        grantedBy: new mongoose_1.default.Types.ObjectId(grantedBy),
        expiresAt: expiresAt || undefined,
        notes,
    };
    const doc = await EbookAccess_1.default.findOneAndUpdate({ user: userId, book: bookId }, {
        $set: updatePayload,
        $unset: {
            revokedBy: '',
            revokedAt: '',
            revokedReason: '',
        },
    }, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
    }).populate('user', 'fullName email').populate('book', 'title coverImage digitalFiles');
    if (!doc) {
        throw new Error('Không thể cấp quyền ebook');
    }
    return doc;
}
async function updateEbookAccess(params) {
    const { id, accessLevel, status, expiresAt, notes, updatedBy } = params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new Error('ID quyền truy cập không hợp lệ');
    }
    const update = {
        $set: {
            updatedBy: new mongoose_1.default.Types.ObjectId(updatedBy),
        },
    };
    if (accessLevel) {
        update.$set.accessLevel = accessLevel;
    }
    if (typeof notes === 'string') {
        update.$set.notes = notes;
    }
    if (expiresAt === null) {
        update.$unset = { ...(update.$unset || {}), expiresAt: '' };
    }
    else if (expiresAt) {
        update.$set.expiresAt = expiresAt;
    }
    if (status) {
        update.$set.status = status;
        if (status === 'REVOKED') {
            update.$set.revokedBy = new mongoose_1.default.Types.ObjectId(updatedBy);
            update.$set.revokedAt = new Date();
        }
        else {
            update.$unset = { ...(update.$unset || {}), revokedBy: '', revokedAt: '', revokedReason: '' };
        }
    }
    const doc = await EbookAccess_1.default.findByIdAndUpdate(id, update, { new: true })
        .populate('user', 'fullName email')
        .populate('book', 'title coverImage digitalFiles');
    return doc;
}
async function revokeEbookAccess(id, revokedBy, revokedReason) {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new Error('ID quyền truy cập không hợp lệ');
    }
    return EbookAccess_1.default.findByIdAndUpdate(id, {
        status: 'REVOKED',
        revokedBy: new mongoose_1.default.Types.ObjectId(revokedBy),
        revokedAt: new Date(),
        revokedReason,
    }, { new: true })
        .populate('user', 'fullName email')
        .populate('book', 'title coverImage digitalFiles');
}
async function listEbookAccess(params) {
    const { page = 1, limit = 20, userId, bookId, status } = params;
    const query = {};
    if (userId) {
        query.user = userId;
    }
    if (bookId) {
        query.book = bookId;
    }
    if (status) {
        query.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
        EbookAccess_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('user', 'fullName email')
            .populate('book', 'title coverImage digitalFiles'),
        EbookAccess_1.default.countDocuments(query),
    ]);
    return {
        items,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
}
async function getActiveEbookAccessByUser(userId) {
    return EbookAccess_1.default.find({
        user: userId,
        status: ACTIVE_STATUS,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    })
        .sort({ updatedAt: -1 })
        .populate('book', 'title coverImage digitalFiles authorId')
        .lean();
}
async function expireEbookAccesses() {
    const now = new Date();
    const result = await EbookAccess_1.default.updateMany({
        status: ACTIVE_STATUS,
        expiresAt: { $lte: now },
    }, {
        $set: { status: 'EXPIRED' },
    });
    return result.modifiedCount;
}
//# sourceMappingURL=ebookAccessService.js.map