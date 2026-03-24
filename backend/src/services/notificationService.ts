import Notification, { NotificationChannel, NotificationType } from '../models/Notification';
import User from '../models/User';
import { sendGenericNotificationEmail } from './emailService';
import {
  ensureAtLeastOneChannelEnabled,
  isNotificationChannelEnabled,
  isNotificationTypeEnabled,
  mergeWithDefaultPreferences
} from '../utils/notificationPreferences';

interface NotificationEmailOptions {
  subject?: string;
  actionUrl?: string;
  actionLabel?: string;
  footerNote?: string;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  emailOptions?: NotificationEmailOptions;
}

const DEFAULT_CHANNELS: NotificationChannel[] = ['IN_APP'];

export async function createNotification(payload: NotificationPayload) {
  const { userId, title, message, type = 'SYSTEM', data } = payload;

  const user = await User.findById(userId).select('email notificationPreferences');
  if (!user) {
    throw new Error('Không tìm thấy người dùng khi tạo thông báo');
  }

  const preferences = mergeWithDefaultPreferences(user.notificationPreferences || undefined);
  const channels = payload.channels?.length ? payload.channels : DEFAULT_CHANNELS;

  if (!ensureAtLeastOneChannelEnabled(preferences)) {
    return null;
  }

  const typeEnabled = isNotificationTypeEnabled(preferences, type);
  if (!typeEnabled) {
    return null;
  }

  let notification = null;
  const shouldCreateInApp = channels.includes('IN_APP') && isNotificationChannelEnabled(preferences, 'inApp');
  const shouldSendEmail =
    channels.includes('EMAIL') && isNotificationChannelEnabled(preferences, 'email') && Boolean(user.email);

  if (shouldCreateInApp) {
    notification = await Notification.create({
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
    await sendGenericNotificationEmail(user.email, {
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

export async function createBulkNotifications(payloads: NotificationPayload[]) {
  if (!payloads.length) {
    return [];
  }

  const userIds = [...new Set(payloads.map((payload) => payload.userId))];
  const users = await User.find({ _id: { $in: userIds } }).select('email notificationPreferences');
  const userMap = new Map(users.map((user) => [user.id, user]));

  const docsToInsert: Array<{
    user: string;
    title: string;
    message: string;
    type: NotificationType;
    data?: Record<string, any>;
    channels: NotificationChannel[];
    deliveredChannels: NotificationChannel[];
  }> = [];

  const emailPromises: Promise<void>[] = [];

  for (const payload of payloads) {
    const type = payload.type || 'SYSTEM';
    const channels = payload.channels?.length ? payload.channels : DEFAULT_CHANNELS;
    const user = userMap.get(payload.userId);

    if (!user) {
      continue;
    }

    const preferences = mergeWithDefaultPreferences(user.notificationPreferences || undefined);
    if (!ensureAtLeastOneChannelEnabled(preferences) || !isNotificationTypeEnabled(preferences, type)) {
      continue;
    }

    if (channels.includes('IN_APP') && isNotificationChannelEnabled(preferences, 'inApp')) {
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

    if (
      channels.includes('EMAIL') &&
      isNotificationChannelEnabled(preferences, 'email') &&
      user.email
    ) {
      emailPromises.push(
        sendGenericNotificationEmail(user.email, {
          subject: payload.emailOptions?.subject ?? payload.title,
          title: payload.title,
          message: payload.message,
          actionUrl: payload.emailOptions?.actionUrl,
          actionLabel: payload.emailOptions?.actionLabel,
          footerNote: payload.emailOptions?.footerNote
        })
      );
    }
  }

  const [notifications] = await Promise.all([
    docsToInsert.length ? Notification.insertMany(docsToInsert) : Promise.resolve([])
  ]);

  await Promise.all(emailPromises);

  return notifications;
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    },
    { new: true }
  );
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
  return result.modifiedCount || 0;
}

