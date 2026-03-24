"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPreferences = exports.getNotificationPreferences = void 0;
const User_1 = __importDefault(require("../models/User"));
const notificationPreferences_1 = require("../utils/notificationPreferences");
const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await User_1.default.findById(userId).select('notificationPreferences');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        const preferences = (0, notificationPreferences_1.mergeWithDefaultPreferences)(user.notificationPreferences || undefined);
        return res.status(200).json({
            success: true,
            data: preferences
        });
    }
    catch (error) {
        console.error('Error getting notification preferences:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin cấu hình thông báo'
        });
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const sanitized = (0, notificationPreferences_1.sanitizeNotificationPreferences)(req.body);
        if (!(0, notificationPreferences_1.ensureAtLeastOneChannelEnabled)(sanitized)) {
            return res.status(400).json({
                success: false,
                message: 'Bạn phải bật ít nhất một kênh nhận thông báo (email hoặc trong ứng dụng)'
            });
        }
        const updatedUser = await User_1.default.findByIdAndUpdate(userId, {
            $set: {
                notificationPreferences: sanitized
            }
        }, {
            new: true,
            runValidators: true
        }).select('notificationPreferences');
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        const preferences = (0, notificationPreferences_1.mergeWithDefaultPreferences)(updatedUser.notificationPreferences || undefined);
        return res.status(200).json({
            success: true,
            message: 'Cập nhật cài đặt thông báo thành công',
            data: preferences
        });
    }
    catch (error) {
        console.error('Error updating notification preferences:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể cập nhật cài đặt thông báo'
        });
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
//# sourceMappingURL=notificationPreferenceController.js.map