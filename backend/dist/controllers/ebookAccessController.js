"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyEbookAccess = exports.revokeAccess = exports.updateAccess = exports.grantAccess = exports.getEbookAccessList = void 0;
const ebookAccessService_1 = require("../services/ebookAccessService");
const parseDate = (value) => {
    if (value === null)
        return null;
    if (!value)
        return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error('Giá trị ngày không hợp lệ');
    }
    return date;
};
const getEbookAccessList = async (req, res) => {
    try {
        const { page = '1', limit = '20', userId, bookId, status } = req.query;
        const data = await (0, ebookAccessService_1.listEbookAccess)({
            page: Number(page),
            limit: Number(limit),
            userId,
            bookId,
            status: status,
        });
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error('Error fetching ebook access list:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Không thể lấy danh sách quyền ebook',
        });
    }
};
exports.getEbookAccessList = getEbookAccessList;
const grantAccess = async (req, res) => {
    try {
        const { userId, bookId, accessLevel, expiresAt, notes } = req.body;
        const grantedBy = req.user?.userId;
        if (!grantedBy) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!userId || !bookId) {
            return res.status(400).json({
                success: false,
                message: 'userId và bookId là bắt buộc',
            });
        }
        const parsedExpiresAt = parseDate(expiresAt) || undefined;
        const access = await (0, ebookAccessService_1.grantEbookAccess)({
            userId,
            bookId,
            accessLevel,
            expiresAt: parsedExpiresAt,
            grantedBy,
            notes,
        });
        return res.status(201).json({
            success: true,
            message: 'Đã cấp quyền truy cập ebook',
            data: access,
        });
    }
    catch (error) {
        console.error('Error granting ebook access:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Không thể cấp quyền truy cập ebook',
        });
    }
};
exports.grantAccess = grantAccess;
const updateAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { accessLevel, status, expiresAt, notes } = req.body;
        const updatedBy = req.user?.userId;
        if (!updatedBy) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const parsedExpiresAt = expiresAt === null ? null : (parseDate(expiresAt) || undefined);
        const access = await (0, ebookAccessService_1.updateEbookAccess)({
            id,
            accessLevel,
            status,
            expiresAt: parsedExpiresAt,
            notes,
            updatedBy,
        });
        if (!access) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền truy cập',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Đã cập nhật quyền truy cập',
            data: access,
        });
    }
    catch (error) {
        console.error('Error updating ebook access:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Không thể cập nhật quyền truy cập ebook',
        });
    }
};
exports.updateAccess = updateAccess;
const revokeAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const revokedBy = req.user?.userId;
        if (!revokedBy) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const access = await (0, ebookAccessService_1.revokeEbookAccess)(id, revokedBy, reason);
        if (!access) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền truy cập',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Đã thu hồi quyền truy cập',
            data: access,
        });
    }
    catch (error) {
        console.error('Error revoking ebook access:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Không thể thu hồi quyền truy cập',
        });
    }
};
exports.revokeAccess = revokeAccess;
const getMyEbookAccess = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const data = await (0, ebookAccessService_1.getActiveEbookAccessByUser)(userId);
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error('Error fetching my ebook access:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Không thể lấy quyền truy cập ebook',
        });
    }
};
exports.getMyEbookAccess = getMyEbookAccess;
//# sourceMappingURL=ebookAccessController.js.map