import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../services/notificationService';

interface AuthRequest extends Request {
  user?: any;
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, status, channel } = req.query as {
      page?: string;
      limit?: string;
      status?: string;
      channel?: string;
    };

    const query: any = { user: userId };
    if (status === 'unread') {
      query.isRead = false;
    } else if (status === 'read') {
      query.isRead = true;
    }

    if (channel === 'EMAIL' || channel === 'IN_APP') {
      query.channels = channel;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query)
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
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông báo'
    });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const updated = await markNotificationAsRead(userId, id);
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
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông báo'
    });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const modifiedCount = await markAllNotificationsAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
      data: { updated: modifiedCount }
    });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông báo'
    });
  }
};

export const getNotificationStats = async (req: AuthRequest, res: Response) => {
  try {
    // Get total notifications
    const totalNotifications = await Notification.countDocuments({});
    const unreadNotifications = await Notification.countDocuments({ isRead: false });
    const readNotifications = await Notification.countDocuments({ isRead: true });

    // Count by type
    const notificationsByType = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeMap: Record<string, number> = {
      'favorite-available': 0,
      'borrow-reminder': 0,
      'reservation-ready': 0,
      'membership-expiring': 0
    };

    notificationsByType.forEach((item) => {
      if (item._id && typeMap.hasOwnProperty(item._id)) {
        typeMap[item._id] = item.count;
      }
    });

    // Recent activity
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);

    const [todayCount, weekCount, monthCount] = await Promise.all([
      Notification.countDocuments({ createdAt: { $gte: todayStart } }),
      Notification.countDocuments({ createdAt: { $gte: weekStart } }),
      Notification.countDocuments({ createdAt: { $gte: monthStart } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        unreadNotifications,
        readNotifications,
        notificationsByType: typeMap,
        recentActivity: {
          todayCount,
          weekCount,
          monthCount
        }
      }
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê thông báo'
    });
  }
};

