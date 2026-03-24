"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const notificationService_1 = require("../services/notificationService");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 10, status, channel } = req.query;
        const query = { user: userId };
        if (status === 'unread') {
            query.isRead = false;
        }
        else if (status === 'read') {
            query.isRead = true;
        }
        if (channel === 'EMAIL' || channel === 'IN_APP') {
            query.channels = channel;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [notifications, total] = await Promise.all([
            Notification_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Notification_1.default.countDocuments(query)
        ]);
        return res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông báo'
        });
    }
};
exports.getNotifications = getNotifications;
const markNotificationRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const updated = await (0, notificationService_1.markNotificationAsRead)(userId, id);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Đã đánh dấu đã đọc',
            data: updated
        });
    }
    catch (error) {
        console.error('Error marking notification read:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông báo'
        });
    }
};
exports.markNotificationRead = markNotificationRead;
const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const modifiedCount = await (0, notificationService_1.markAllNotificationsAsRead)(userId);
        return res.status(200).json({
            success: true,
            message: 'Đã đánh dấu tất cả thông báo là đã đọc',
            data: { updated: modifiedCount }
        });
    }
    catch (error) {
        console.error('Error marking all notifications read:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông báo'
        });
    }
};
exports.markAllNotificationsRead = markAllNotificationsRead;
//# sourceMappingURL=notificationController.js.map