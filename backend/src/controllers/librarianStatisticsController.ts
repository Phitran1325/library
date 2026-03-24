import { Request, Response } from 'express';
import {
  getLibrarianPersonalStatistics,
  getLibrarianActivityHistory
} from '../services/librarianStatisticsService';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * GET /api/librarian/statistics/personal
 * Lấy thống kê cá nhân của thủ thư
 */
export const getPersonalStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const librarianId = req.user?.userId;
    
    if (!librarianId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const period = (req.query.period as 'today' | 'week' | 'month' | 'year' | 'all') || 'all';
    
    const statistics = await getLibrarianPersonalStatistics(librarianId, period);
    
    return res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    console.error('Error getting librarian personal statistics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thống kê cá nhân'
    });
  }
};

/**
 * GET /api/librarian/statistics/personal/activity-history
 * Lấy lịch sử hoạt động của thủ thư
 */
export const getActivityHistory = async (req: AuthRequest, res: Response) => {
  try {
    const librarianId = req.user?.userId;
    
    if (!librarianId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    
    const activities = await getLibrarianActivityHistory(librarianId, page, limit);
    
    return res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total: activities.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting librarian activity history:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch sử hoạt động'
    });
  }
};


