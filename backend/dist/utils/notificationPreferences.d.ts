import { NotificationType } from '../models/Notification';
export type NotificationPreferenceChannel = 'email' | 'inApp';
export interface NotificationPreferenceChannels {
    email: {
        enabled: boolean;
    };
    inApp: {
        enabled: boolean;
    };
}
export interface NotificationPreferenceTypes {
    system: boolean;
    borrowReminder: boolean;
    overdueWarning: boolean;
    favorite: boolean;
}
export interface NotificationPreferences {
    channels: NotificationPreferenceChannels;
    types: NotificationPreferenceTypes;
}
export declare const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences;
export declare function mergeWithDefaultPreferences(preferences?: Partial<NotificationPreferences>): NotificationPreferences;
export declare function sanitizeNotificationPreferences(input: any): NotificationPreferences;
export declare function isNotificationChannelEnabled(preferences: NotificationPreferences, channel: NotificationPreferenceChannel): boolean;
export declare function isNotificationTypeEnabled(preferences: NotificationPreferences, type: NotificationType): boolean;
export declare function ensureAtLeastOneChannelEnabled(preferences: NotificationPreferences): boolean;
export declare function getPreferenceKeyByNotificationType(type: NotificationType): keyof NotificationPreferenceTypes;
//# sourceMappingURL=notificationPreferences.d.ts.map