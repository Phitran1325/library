import { Request, Response } from 'express';
import {
  grantEbookAccess,
  listEbookAccess,
  updateEbookAccess,
  revokeEbookAccess,
  getActiveEbookAccessByUser,
} from '../services/ebookAccessService';
import { EbookAccessLevel, EbookAccessStatus } from '../models/EbookAccess';

interface AuthRequest extends Request {
  user?: any;
}

const parseDate = (value?: string | null) => {
  if (value === null) return null;
  if (!value) return undefined;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Giá trị ngày không hợp lệ');
  }
  return date;
};

export const getEbookAccessList = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', userId, bookId, status } = req.query as Record<string, string>;

    const data = await listEbookAccess({
      page: Number(page),
      limit: Number(limit),
      userId,
      bookId,
      status: status as EbookAccessStatus | undefined,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching ebook access list:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Không thể lấy danh sách quyền ebook',
    });
  }
};

export const grantAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, bookId, accessLevel, expiresAt, notes } = req.body as {
      userId: string;
      bookId: string;
      accessLevel?: EbookAccessLevel;
      expiresAt?: string;
      notes?: string;
    };

    const grantedBy = req.user?.userId;
    if (!grantedBy) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!userId || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'userId và bookId là bắt buộc',
      });
    }

    const parsedExpiresAt = parseDate(expiresAt) || undefined;

    const access = await grantEbookAccess({
      userId,
      bookId,
      accessLevel,
      expiresAt: parsedExpiresAt,
      grantedBy,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: 'Đã cấp quyền truy cập ebook',
      data: access,
    });
  } catch (error: any) {
    console.error('Error granting ebook access:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Không thể cấp quyền truy cập ebook',
    });
  }
};

export const updateAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { accessLevel, status, expiresAt, notes } = req.body as {
      accessLevel?: EbookAccessLevel;
      status?: EbookAccessStatus;
      expiresAt?: string | null;
      notes?: string;
    };

    const updatedBy = req.user?.userId;
    if (!updatedBy) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const parsedExpiresAt =
      expiresAt === null ? null : (parseDate(expiresAt) || undefined);

    const access = await updateEbookAccess({
      id,
      accessLevel,
      status,
      expiresAt: parsedExpiresAt,
      notes,
      updatedBy,
    });

    if (!access) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyền truy cập',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật quyền truy cập',
      data: access,
    });
  } catch (error: any) {
    console.error('Error updating ebook access:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Không thể cập nhật quyền truy cập ebook',
    });
  }
};

export const revokeAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };
    const revokedBy = req.user?.userId;

    if (!revokedBy) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const access = await revokeEbookAccess(id, revokedBy, reason);

    if (!access) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyền truy cập',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã thu hồi quyền truy cập',
      data: access,
    });
  } catch (error: any) {
    console.error('Error revoking ebook access:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Không thể thu hồi quyền truy cập',
    });
  }
};

export const getMyEbookAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await getActiveEbookAccessByUser(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching my ebook access:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Không thể lấy quyền truy cập ebook',
    });
  }
};

