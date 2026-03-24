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

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
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

const notificationTypeToPreferenceKey: Record<NotificationType, keyof NotificationPreferenceTypes> =
  {
    SYSTEM: 'system',
    BORROW_REMINDER: 'borrowReminder',
    OVERDUE_WARNING: 'overdueWarning',
    FAVORITE_BOOK_AVAILABLE: 'favorite'
  };

export function mergeWithDefaultPreferences(
  preferences?: Partial<NotificationPreferences>
): NotificationPreferences {
  return {
    channels: {
      email: { enabled: preferences?.channels?.email?.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.channels.email.enabled },
      inApp: { enabled: preferences?.channels?.inApp?.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.channels.inApp.enabled }
    },
    types: {
      system: preferences?.types?.system ?? DEFAULT_NOTIFICATION_PREFERENCES.types.system,
      borrowReminder: preferences?.types?.borrowReminder ?? DEFAULT_NOTIFICATION_PREFERENCES.types.borrowReminder,
      overdueWarning: preferences?.types?.overdueWarning ?? DEFAULT_NOTIFICATION_PREFERENCES.types.overdueWarning,
      favorite: preferences?.types?.favorite ?? DEFAULT_NOTIFICATION_PREFERENCES.types.favorite
    }
  };
}

export function sanitizeNotificationPreferences(input: any): NotificationPreferences {
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

export function isNotificationChannelEnabled(
  preferences: NotificationPreferences,
  channel: NotificationPreferenceChannel
): boolean {
  return channel === 'email'
    ? preferences.channels.email.enabled
    : preferences.channels.inApp.enabled;
}

export function isNotificationTypeEnabled(
  preferences: NotificationPreferences,
  type: NotificationType
): boolean {
  const key = notificationTypeToPreferenceKey[type];
  if (!key) {
    return true;
  }
  return preferences.types[key];
}

export function ensureAtLeastOneChannelEnabled(
  preferences: NotificationPreferences
): boolean {
  return preferences.channels.email.enabled || preferences.channels.inApp.enabled;
}

export function getPreferenceKeyByNotificationType(
  type: NotificationType
): keyof NotificationPreferenceTypes {
  return notificationTypeToPreferenceKey[type];
}


