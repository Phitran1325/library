import { Request, Response } from 'express';
import {
  getEbookContentReportById,
  listEbookContentReports,
  listMyContentReports,
  submitEbookContentReport,
  updateEbookContentReport,
} from '../services/ebookContentReportService';
import { EbookReportIssueType, EbookReportStatus } from '../models/EbookContentReport';

interface AuthRequest extends Request {
  user?: any;
}

const ensureAuthUser = (req: AuthRequest) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
};

export const submitReport = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = ensureAuthUser(req);
    const { bookId, digitalFileId, issueType, description, pageNumber, evidenceUrls } = req.body;

    const report = await submitEbookContentReport({
      reporterId,
      bookId,
      digitalFileId,
      issueType,
      description,
      pageNumber,
      evidenceUrls,
    });

    return res.status(201).json({
      success: true,
      message: 'Đã gửi báo cáo nội dung',
      data: report,
    });
  } catch (error: any) {
    const status = error?.message === 'Unauthorized' ? 401 : 400;
    return res.status(status).json({
      success: false,
      message: error?.message || 'Không thể gửi báo cáo nội dung ebook',
    });
  }
};

export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = ensureAuthUser(req);
    const { page = '1', limit = '10', status } = req.query as Record<string, string>;

    const data = await listMyContentReports(reporterId, {
      page: Number(page),
      limit: Number(limit),
      status: status as EbookReportStatus | undefined,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    const status = error?.message === 'Unauthorized' ? 401 : 400;
    return res.status(status).json({
      success: false,
      message: error?.message || 'Không thể lấy danh sách báo cáo của bạn',
    });
  }
};

export const listReports = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status, issueType, bookId, reporterId, search } =
      req.query as Record<string, string>;

    const data = await listEbookContentReports({
      page: Number(page),
      limit: Number(limit),
      status: status as EbookReportStatus | undefined,
      issueType: issueType as EbookReportIssueType | undefined,
      bookId,
      reporterId,
      search,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error?.message || 'Không thể lấy danh sách báo cáo',
    });
  }
};

export const getReportDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const report = await getEbookContentReportById(id);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error?.message || 'Không thể lấy chi tiết báo cáo',
    });
  }
};

export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const handledBy = ensureAuthUser(req);
    const { id } = req.params;
    const { status, resolutionNotes } = req.body as {
      status?: EbookReportStatus;
      resolutionNotes?: string;
    };

    const report = await updateEbookContentReport({
      id,
      handledBy,
      status,
      resolutionNotes,
    });

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật báo cáo',
      data: report,
    });
  } catch (error: any) {
    const status = error?.message === 'Unauthorized' ? 401 : 400;
    return res.status(status).json({
      success: false,
      message: error?.message || 'Không thể cập nhật báo cáo',
    });
  }
};


