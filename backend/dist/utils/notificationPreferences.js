"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NOTIFICATION_PREFERENCES = void 0;
exports.mergeWithDefaultPreferences = mergeWithDefaultPreferences;
exports.sanitizeNotificationPreferences = sanitizeNotificationPreferences;
exports.isNotificationChannelEnabled = isNotificationChannelEnabled;
exports.isNotificationTypeEnabled = isNotificationTypeEnabled;
exports.ensureAtLeastOneChannelEnabled = ensureAtLeastOneChannelEnabled;
exports.getPreferenceKeyByNotificationType = getPreferenceKeyByNotificationType;
exports.DEFAULT_NOTIFICATION_PREFERENCES = {
    channels: {
        email: { enabled: true },
        inApp: { enabled: true }
    },
    types: {
        system: true,
        borrowReminder: true,
        overdueWarning: true,
        favorite: true
    }
};
const notificationTypeToPreferenceKey = {
    SYSTEM: 'system',
    BORROW_REMINDER: 'borrowReminder',
    OVERDUE_WARNING: 'overdueWarning',
    FAVORITE_BOOK_AVAILABLE: 'favorite'
};
function mergeWithDefaultPreferences(preferences) {
    return {
        channels: {
            email: { enabled: preferences?.channels?.email?.enabled ?? exports.DEFAULT_NOTIFICATION_PREFERENCES.channels.email.enabled },
            inApp: { enabled: preferences?.channels?.inApp?.enabled ?? exports.DEFAULT_NOTIFICATION_PREFERENCES.channels.inApp.enabled }
        },
        types: {
            system: preferences?.types?.system ?? exports.DEFAULT_NOTIFICATION_PREFERENCES.types.system,
            borrowReminder: preferences?.types?.borrowReminder ?? exports.DEFAULT_NOTIFICATION_PREFERENCES.types.borrowReminder,
            overdueWarning: preferences?.types?.overdueWarning ?? exports.DEFAULT_NOTIFICATION_PREFERENCES.types.overdueWarning,
            favorite: preferences?.types?.favorite ?? exports.DEFAULT_NOTIFICATION_PREFERENCES.types.favorite
        }
    };
}
function sanitizeNotificationPreferences(input) {
    if (!input || typeof input !== 'object') {
        return mergeWithDefaultPreferences();
    }
    const merged = mergeWithDefaultPreferences(input);
    return {
        channels: {
            email: { enabled: Boolean(merged.channels.email.enabled) },
            inApp: { enabled: Boolean(merged.channels.inApp.enabled) }
        },
        types: {
            system: Boolean(merged.types.system),
            borrowReminder: Boolean(merged.types.borrowReminder),
            overdueWarning: Boolean(merged.types.overdueWarning),
            favorite: Boolean(merged.types.favorite)
        }
    };
}
function isNotificationChannelEnabled(preferences, channel) {
    return channel === 'email'
        ? preferences.channels.email.enabled
        : preferences.channels.inApp.enabled;
}
function isNotificationTypeEnabled(preferences, type) {
    const key = notificationTypeToPreferenceKey[type];
    if (!key) {
        return true;
    }
    return preferences.types[key];
}
function ensureAtLeastOneChannelEnabled(preferences) {
    return preferences.channels.email.enabled || preferences.channels.inApp.enabled;
}
function getPreferenceKeyByNotificationType(type) {
    return notificationTypeToPreferenceKey[type];
}
//# sourceMappingURL=notificationPreferences.js.map