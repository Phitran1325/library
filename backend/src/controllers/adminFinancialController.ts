import { Request, Response } from 'express';
import {
  getFinancialOverview,
  FinancialPeriod
} from '../services/financialReportService';

interface AuthRequest extends Request {
  user?: any;
}

export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as FinancialPeriod) || 'all';
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const overview = await getFinancialOverview({
      period,
      startDate,
      endDate
    });

    return res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error: any) {
    console.error('Error getting financial summary:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy báo cáo tài chính'
    });
  }
};


