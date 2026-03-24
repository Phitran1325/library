"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReadingProgress = exports.getReadUrl = exports.getReadableBook = exports.getMyEbookLibrary = void 0;
const ebookReaderService_1 = require("../services/ebookReaderService");
const ensureAuthUser = (req) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new Error('Unauthorized');
    }
    return userId;
};
const getMyEbookLibrary = async (req, res) => {
    try {
        const userId = ensureAuthUser(req);
        const { page = '1', limit = '12', search } = req.query;
        const data = await (0, ebookReaderService_1.listReadableBooks)(userId, {
            page: Number(page),
            limit: Number(limit),
            search,
        });
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        const message = error?.message === 'Unauthorized' ? 'Bạn cần đăng nhập' : error?.message || 'Lỗi hệ thống';
        const status = error?.message === 'Unauthorized' ? 401 : 400;
        console.error('getMyEbookLibrary error:', error);
        return res.status(status).json({ success: false, message });
    }
};
exports.getMyEbookLibrary = getMyEbookLibrary;
const getReadableBook = async (req, res) => {
    try {
        const userId = ensureAuthUser(req);
        const { bookId } = req.params;
        const data = await (0, ebookReaderService_1.getReadableBookDetail)(userId, bookId);
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        const message = error?.message === 'Unauthorized' ? 'Bạn cần đăng nhập' : error?.message || 'Lỗi hệ thống';
        const status = error?.message === 'Unauthorized' ? 401 : 400;
        console.error('getReadableBook error:', error);
        return res.status(status).json({ success: false, message });
    }
};
exports.getReadableBook = getReadableBook;
const getReadUrl = async (req, res) => {
    try {
        const userId = ensureAuthUser(req);
        const { bookId, fileId } = req.params;
        const { ttl } = req.query;
        const data = await (0, ebookReaderService_1.getReadUrlForFile)({
            userId,
            bookId,
            fileId,
            ttlSeconds: ttl ? Number(ttl) : undefined,
        });
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        const message = error?.message === 'Unauthorized' ? 'Bạn cần đăng nhập' : error?.message || 'Lỗi hệ thống';
        const status = error?.message === 'Unauthorized' ? 401 : 400;
        console.error('getReadUrl error:', error);
        return res.status(status).json({ success: false, message });
    }
};
exports.getReadUrl = getReadUrl;
const updateReadingProgress = async (req, res) => {
    try {
        const userId = ensureAuthUser(req);
        const { bookId, fileId } = req.params;
        const { percentage, currentPage, totalPages, lastLocation, deviceInfo } = req.body || {};
        const progress = await (0, ebookReaderService_1.saveReadingProgress)({
            userId,
            bookId,
            fileId,
            percentage,
            currentPage,
            totalPages,
            lastLocation,
            deviceInfo,
        });
        return res.status(200).json({
            success: true,
            message: 'Đã lưu tiến trình đọc',
            data: progress,
        });
    }
    catch (error) {
        const message = error?.message === 'Unauthorized' ? 'Bạn cần đăng nhập' : error?.message || 'Lỗi hệ thống';
        const status = error?.message === 'Unauthorized' ? 401 : 400;
        console.error('updateReadingProgress error:', error);
        return res.status(status).json({ success: false, message });
    }
};
exports.updateReadingProgress = updateReadingProgress;
//# sourceMappingURL=ebookReaderController.js.map