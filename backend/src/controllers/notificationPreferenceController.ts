import { Request, Response } from 'express';
import User from '../models/User';
import {
  ensureAtLeastOneChannelEnabled,
  mergeWithDefaultPreferences,
  sanitizeNotificationPreferences
} from '../utils/notificationPreferences';

interface AuthRequest extends Request {
  user?: any;
}

export const getNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('notificationPreferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const preferences = mergeWithDefaultPreferences(user.notificationPreferences || undefined);

    return res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin cấu hình thông báo'
    });
  }
};

export const updateNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const sanitized = sanitizeNotificationPreferences(req.body);

    if (!ensureAtLeastOneChannelEnabled(sanitized)) {
      return res.status(400).json({
        success: false,
        message: 'Bạn phải bật ít nhất một kênh nhận thông báo (email hoặc trong ứng dụng)'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          notificationPreferences: sanitized
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).select('notificationPreferences');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const preferences = mergeWithDefaultPreferences(updatedUser.notificationPreferences || undefined);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cài đặt thông báo thành công',
      data: preferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật cài đặt thông báo'
    });
  }
};


