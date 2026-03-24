import mongoose from 'mongoose';
import EbookAccess from '../models/EbookAccess';
import Book from '../models/Book';
import User from '../models/User';
import EbookContentReport, {
  EBOOK_REPORT_ISSUE_TYPES,
  EBOOK_REPORT_STATUSES,
  EbookReportIssueType,
  EbookReportStatus,
} from '../models/EbookContentReport';
import { createBulkNotifications } from './notificationService';
import websocketService from './websocketService';

const ACTIVE_ACCESS_STATUS = 'ACTIVE';
const MAX_EVIDENCE_URLS = 5;

const ensureObjectId = (value: string, field: string) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`${field} không hợp lệ`);
  }
  return new mongoose.Types.ObjectId(value);
};

const buildActiveAccessQuery = (userId: string, bookId: string) => ({
  user: ensureObjectId(userId, 'userId'),
  book: ensureObjectId(bookId, 'bookId'),
  status: ACTIVE_ACCESS_STATUS,
  $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
});

const normalizeEvidenceUrls = (urls?: string[]) => {
  if (!Array.isArray(urls)) {
    return [];
  }

  const isValidUrl = (value: string) => /^https?:\/\/.{3,}$/i.test(value.trim());

  return urls
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= 500 && isValidUrl(value))
    .slice(0, MAX_EVIDENCE_URLS);
};

interface CreateReportParams {
  reporterId: string;
  bookId: string;
  digitalFileId?: string;
  issueType: EbookReportIssueType;
  description: string;
  pageNumber?: number;
  evidenceUrls?: string[];
}

interface ListReportParams {
  page?: number;
  limit?: number;
  status?: EbookReportStatus;
  issueType?: EbookReportIssueType;
  bookId?: string;
  reporterId?: string;
  search?: string;
}

interface UpdateReportParams {
  id: string;
  handledBy: string;
  status?: EbookReportStatus;
  resolutionNotes?: string;
}

const validateIssueType = (issueType: string) => {
  if (!EBOOK_REPORT_ISSUE_TYPES.includes(issueType as EbookReportIssueType)) {
    throw new Error('Loại vấn đề không hợp lệ');
  }
};

const validateStatus = (status: string) => {
  if (!EBOOK_REPORT_STATUSES.includes(status as EbookReportStatus)) {
    throw new Error('Trạng thái báo cáo không hợp lệ');
  }
};

const ensureBookAndFile = async (bookId: string, digitalFileId?: string) => {
  const book = await Book.findById(bookId).select('title digitalFiles isActive status').lean();

  if (!book) {
    throw new Error('Không tìm thấy sách');
  }

  if (!book.digitalFiles || book.digitalFiles.length === 0) {
    throw new Error('Sách chưa có file ebook để báo cáo');
  }

  if (!digitalFileId) {
    return { book };
  }

  const match = book.digitalFiles.find(
    (file: any) => file._id?.toString() === digitalFileId.toString()
  );

  if (!match) {
    throw new Error('File ebook không thuộc về sách này');
  }

  return { book, digitalFile: match };
};

const ensureActiveAccess = async (userId: string, bookId: string) => {
  const access = await EbookAccess.findOne(buildActiveAccessQuery(userId, bookId)).lean();
  if (!access) {
    throw new Error('Bạn chưa có quyền đọc ebook này hoặc quyền đã hết hạn');
  }
};

export const submitEbookContentReport = async (params: CreateReportParams) => {
  const { reporterId, bookId, digitalFileId, issueType, description, pageNumber, evidenceUrls } =
    params;

  if (!description || description.trim().length < 20) {
    throw new Error('Mô tả phải có ít nhất 20 ký tự');
  }

  if (description.trim().length > 2000) {
    throw new Error('Mô tả không được vượt quá 2000 ký tự');
  }

  if (typeof pageNumber === 'number') {
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 10000) {
      throw new Error('Số trang không hợp lệ');
    }
  }

  validateIssueType(issueType);
  // Bỏ kiểm tra ensureActiveAccess để cho phép user đã đọc được sách có thể report
  // (ngay cả khi không có record EbookAccess trong DB hoặc đã hết hạn)
  await ensureBookAndFile(bookId, digitalFileId);

  const report = await EbookContentReport.create({
    reporter: ensureObjectId(reporterId, 'reporterId'),
    book: ensureObjectId(bookId, 'bookId'),
    digitalFileId: digitalFileId ? ensureObjectId(digitalFileId, 'fileId') : undefined,
    issueType,
    description: description.trim(),
    pageNumber,
    evidenceUrls: normalizeEvidenceUrls(evidenceUrls),
  });

  await report.populate([
    { path: 'book', select: 'title coverImage' },
    { path: 'reporter', select: 'fullName email' },
    { path: 'handledBy', select: 'fullName email' },
  ]);

  // Gửi thông báo tới tất cả thủ thư và admin khi có báo cáo ebook mới
  try {
    // Lấy tất cả Librarian và Admin
    const staff = await User.find({
      role: { $in: ['Librarian', 'Admin'] },
      isActive: true
    }).select('_id fullName email role');

    if (staff.length > 0) {
      const bookTitle = (report as any).book?.title || 'không xác định';
      const reporterName =
        (report as any).reporter?.fullName || (report as any).reporter?.email || 'một độc giả';
      const title = '📚 Báo cáo ebook mới';
      const message = `Người dùng ${reporterName} vừa báo cáo ebook "${bookTitle}". Vui lòng kiểm tra và xử lý.`;

      const payloads = staff.map((user) => ({
        userId: (user._id as any).toString(),
        title,
        message,
        type: 'SYSTEM' as const,
        data: {
          reportId: (report as any)._id?.toString?.(),
          bookId,
          reporterId,
          issueType,
        },
      }));

      await createBulkNotifications(payloads);

      // Gửi realtime qua WebSocket nếu staff đang online
      try {
        const socketsMap = (websocketService as any).connectedUsers as
          | Map<string, any>
          | undefined;
        if (socketsMap) {
          for (const user of staff) {
            const key = (user._id as any).toString();
            const socket = socketsMap.get(key);
            if (socket) {
              socket.emit('notification', {
                type: 'SYSTEM',
                title,
                message,
                data: {
                  reportId: (report as any)._id?.toString?.(),
                  bookId,
                  reporterId,
                  issueType,
                },
              });
            }
          }
        }
      } catch (wsError) {
        console.error('Lỗi khi gửi WebSocket notification cho báo cáo ebook:', wsError);
      }
    }
  } catch (notifyError) {
    console.error('Lỗi khi tạo thông báo cho báo cáo ebook:', notifyError);
    // Không throw error để không làm gián đoạn việc tạo report
  }

  return report;
};

export const listEbookContentReports = async (params: ListReportParams) => {
  const { page = 1, limit = 20, status, issueType, bookId, reporterId, search } = params;

  const query: Record<string, any> = {};

  if (status) {
    validateStatus(status);
    query.status = status;
  }

  if (issueType) {
    validateIssueType(issueType);
    query.issueType = issueType;
  }

  if (bookId) {
    query.book = ensureObjectId(bookId, 'bookId');
  }

  if (reporterId) {
    query.reporter = ensureObjectId(reporterId, 'reporterId');
  }

  if (search) {
    query.description = { $regex: search, $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    EbookContentReport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('book', 'title coverImage')
      .populate('reporter', 'fullName email')
      .populate('handledBy', 'fullName email')
      .lean(),
    EbookContentReport.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 0,
    },
  };
};

export const listMyContentReports = async (
  reporterId: string,
  params: Pick<ListReportParams, 'page' | 'limit' | 'status'>
) => {
  return listEbookContentReports({
    ...params,
    reporterId,
  });
};

export const getEbookContentReportById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('ID báo cáo không hợp lệ');
  }

  const report = await EbookContentReport.findById(id)
    .populate('book', 'title coverImage')
    .populate('reporter', 'fullName email')
    .populate('handledBy', 'fullName email');
  if (!report) {
    throw new Error('Không tìm thấy báo cáo');
  }
  return report;
};

export const updateEbookContentReport = async (params: UpdateReportParams) => {
  const { id, handledBy, status, resolutionNotes } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('ID báo cáo không hợp lệ');
  }

  if (!mongoose.Types.ObjectId.isValid(handledBy)) {
    throw new Error('Người xử lý không hợp lệ');
  }

  if (!status && typeof resolutionNotes !== 'string') {
    throw new Error('Vui lòng cung cấp trạng thái hoặc ghi chú xử lý');
  }

  if (status) {
    validateStatus(status);
  }

  const update: any = {
    $set: {},
    $unset: {},
  };

  if (status) {
    update.$set.status = status;
    if (status === 'PENDING') {
      update.$unset.handledBy = '';
      update.$unset.handledAt = '';
      update.$unset.resolutionNotes = '';
    } else {
      update.$set.handledBy = ensureObjectId(handledBy, 'handledBy');
      update.$set.handledAt = new Date();
    }

    if ((status === 'RESOLVED' || status === 'DISMISSED') && !resolutionNotes?.trim()) {
      throw new Error('Cần có ghi chú khi đóng báo cáo');
    }
  }

  if (typeof resolutionNotes === 'string') {
    if (resolutionNotes.length > 2000) {
      throw new Error('Ghi chú không được vượt quá 2000 ký tự');
    }
    update.$set.resolutionNotes = resolutionNotes.trim();
  }

  if (Object.keys(update.$unset).length === 0) {
    delete update.$unset;
  }

  if (Object.keys(update.$set).length === 0) {
    delete update.$set;
  }

  const report = await EbookContentReport.findByIdAndUpdate(id, update, { new: true })
    .populate('book', 'title coverImage')
    .populate('reporter', 'fullName email')
    .populate('handledBy', 'fullName email');

  if (!report) {
    throw new Error('Không tìm thấy báo cáo để cập nhật');
  }

  return report;
};


