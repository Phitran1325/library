"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.createBulkNotifications = createBulkNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const emailService_1 = require("./emailService");
const notificationPreferences_1 = require("../utils/notificationPreferences");
const DEFAULT_CHANNELS = ['IN_APP'];
async function createNotification(payload) {
    const { userId, title, message, type = 'SYSTEM', data } = payload;
    const user = await User_1.default.findById(userId).select('email notificationPreferences');
    if (!user) {
        throw new Error('Không tìm thấy người dùng khi tạo thông báo');
    }
    const preferences = (0, notificationPreferences_1.mergeWithDefaultPreferences)(user.notificationPreferences || undefined);
    const channels = payload.channels?.length ? payload.channels : DEFAULT_CHANNELS;
    if (!(0, notificationPreferences_1.ensureAtLeastOneChannelEnabled)(preferences)) {
        return null;
    }
    const typeEnabled = (0, notificationPreferences_1.isNotificationTypeEnabled)(preferences, type);
    if (!typeEnabled) {
        return null;
    }
    let notification = null;
    const shouldCreateInApp = channels.includes('IN_APP') && (0, notificationPreferences_1.isNotificationChannelEnabled)(preferences, 'inApp');
    const shouldSendEmail = channels.includes('EMAIL') && (0, notificationPreferences_1.isNotificationChannelEnabled)(preferences, 'email') && Boolean(user.email);
    if (shouldCreateInApp) {
        notification = await Notification_1.default.create({
            user: userId,
            title,
            message,
            type,
            data,
            channels,
            deliveredChannels: ['IN_APP']
        });
    }
    if (shouldSendEmail && user.email) {
        await (0, emailService_1.sendGenericNotificationEmail)(user.email, {
            subject: payload.emailOptions?.subject ?? title,
            title,
            message,
            actionUrl: payload.emailOptions?.actionUrl,
            actionLabel: payload.emailOptions?.actionLabel,
            footerNote: payload.emailOptions?.footerNote
        });
        if (notification) {
            notification.deliveredChannels = Array.from(new Set([...(notification.deliveredChannels || []), 'EMAIL']));
            await notification.save();
        }
    }
    return notification;
}
async function createBulkNotifications(payloads) {
    if (!payloads.length) {
        return [];
    }
    const userIds = [...new Set(payloads.map((payload) => payload.userId))];
    const users = await User_1.default.find({ _id: { $in: userIds } }).select('email notificationPreferences');
    const userMap = new Map(users.map((user) => [user.id, user]));
    const docsToInsert = [];
    const emailPromises = [];
    for (const payload of payloads) {
        const type = payload.type || 'SYSTEM';
        const channels = payload.channels?.length ? payload.channels : DEFAULT_CHANNELS;
        const user = userMap.get(payload.userId);
        if (!user) {
            continue;
        }
        const preferences = (0, notificationPreferences_1.mergeWithDefaultPreferences)(user.notificationPreferences || undefined);
        if (!(0, notificationPreferences_1.ensureAtLeastOneChannelEnabled)(preferences) || !(0, notificationPreferences_1.isNotificationTypeEnabled)(preferences, type)) {
            continue;
        }
        if (channels.includes('IN_APP') && (0, notificationPreferences_1.isNotificationChannelEnabled)(preferences, 'inApp')) {
            docsToInsert.push({
                user: payload.userId,
                title: payload.title,
                message: payload.message,
                type,
                data: payload.data,
                channels,
                deliveredChannels: ['IN_APP']
            });
        }
        if (channels.includes('EMAIL') &&
            (0, notificationPreferences_1.isNotificationChannelEnabled)(preferences, 'email') &&
            user.email) {
            emailPromises.push((0, emailService_1.sendGenericNotificationEmail)(user.email, {
                subject: payload.emailOptions?.subject ?? payload.title,
                title: payload.title,
                message: payload.message,
                actionUrl: payload.emailOptions?.actionUrl,
                actionLabel: payload.emailOptions?.actionLabel,
                footerNote: payload.emailOptions?.footerNote
            }));
        }
    }
    const [notifications] = await Promise.all([
        docsToInsert.length ? Notification_1.default.insertMany(docsToInsert) : Promise.resolve([])
    ]);
    await Promise.all(emailPromises);
    return notifications;
}
async function markNotificationAsRead(userId, notificationId) {
    return Notification_1.default.findOneAndUpdate({ _id: notificationId, user: userId }, {
        $set: {
            isRead: true,
            readAt: new Date()
        }
    }, { new: true });
}
async function markAllNotificationsAsRead(userId) {
    const result = await Notification_1.default.updateMany({ user: userId, isRead: false }, {
        $set: {
            isRead: true,
            readAt: new Date()
        }
    });
    return result.modifiedCount || 0;
}
//# sourceMappingURL=notificationService.js.map