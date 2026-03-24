import mongoose from 'mongoose';
import EbookAccess from '../models/EbookAccess';
import Book from '../models/Book';
import EbookReadingProgress from '../models/EbookReadingProgress';
import { generateEbookDownloadUrl } from './uploadService';

const ACTIVE_STATUS = 'ACTIVE';
const DEFAULT_READ_TTL = Number(process.env.EBOOK_READ_TTL || 180);

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface ReadUrlParams {
  userId: string;
  bookId: string;
  fileId: string;
  ttlSeconds?: number;
}

interface ProgressParams {
  userId: string;
  bookId: string;
  fileId: string;
  percentage?: number;
  currentPage?: number;
  totalPages?: number;
  lastLocation?: string;
  deviceInfo?: {
    platform?: string;
    browser?: string;
    appVersion?: string;
  };
}

const ensureObjectId = (value: string, field: string) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`${field} không hợp lệ`);
  }
  return new mongoose.Types.ObjectId(value);
};

const buildActiveAccessQuery = (userId: string, bookId?: string) => {
  const query: any = {
    user: ensureObjectId(userId, 'userId'),
    status: ACTIVE_STATUS,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  };

  if (bookId) {
    query.book = ensureObjectId(bookId, 'bookId');
  }

  return query;
};

export const listReadableBooks = async (userId: string, params: PaginationParams) => {
  const { page = 1, limit = 12, search } = params;
  const skip = (Number(page) - 1) * Number(limit);

  const baseMatch = buildActiveAccessQuery(userId);

  const pipeline: any[] = [
    { $match: baseMatch },
    {
      $lookup: {
        from: 'books',
        localField: 'book',
        foreignField: '_id',
        as: 'book',
      },
    },
    { $unwind: '$book' },
    {
      $match: {
        'book.isActive': true,
        'book.status': 'available',
        'book.digitalFiles.0': { $exists: true },
      },
    },
  ];

  if (search) {
    pipeline.push({
      $match: {
        'book.title': { $regex: search, $options: 'i' },
      },
    });
  }

  pipeline.push({ $sort: { updatedAt: -1 } });

  const aggregated = await EbookAccess.aggregate([
    ...pipeline,
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $lookup: {
              from: 'ebookReadingProgresses',
              let: { userId: '$user', bookId: '$book._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user', '$$userId'] },
                        { $eq: ['$book', '$$bookId'] },
                      ],
                    },
                  },
                },
                { $sort: { updatedAt: -1 } },
                { $limit: 1 },
              ],
              as: 'latestProgress',
            },
          },
          {
            $project: {
              accessId: '$_id',
              bookId: '$book._id',
              title: '$book.title',
              coverImage: '$book.coverImage',
              authorId: '$book.authorId',
              expiresAt: '$expiresAt',
              grantedAt: '$createdAt',
              updatedAt: '$updatedAt',
              progress: { $arrayElemAt: ['$latestProgress', 0] },
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const items = aggregated?.[0]?.items || [];
  const total = aggregated?.[0]?.total?.[0]?.count || 0;

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

const ensureActiveAccess = async (userId: string, bookId: string) => {
  const access = await EbookAccess.findOne(buildActiveAccessQuery(userId, bookId));
  if (!access) {
    throw new Error('Bạn chưa được cấp quyền đọc ebook này hoặc quyền đã hết hạn');
  }
  return access;
};

export const getReadableBookDetail = async (userId: string, bookId: string) => {
  await ensureActiveAccess(userId, bookId);

  const book = await Book.findById(bookId)
    .select('title coverImage authorId publisherId digitalFiles description isPremium')
    .populate('authorId', 'name')
    .populate('publisherId', 'name')
    .lean();

  if (!book || !book.digitalFiles || book.digitalFiles.length === 0) {
    throw new Error('Sách không tồn tại hoặc chưa có file ebook');
  }

  const progresses = await EbookReadingProgress.find({
    user: userId,
    book: bookId,
  })
    .select('fileId percentage currentPage totalPages lastLocation lastOpenedAt')
    .lean();

  const progressMap = new Map(
    progresses.map((progress) => [progress.fileId.toString(), progress])
  );

  const files = book.digitalFiles.map((file: any) => ({
    id: file._id,
    format: file.format,
    size: file.size,
    uploadedAt: file.uploadedAt,
    hasProgress: progressMap.has(file._id.toString()),
    progress: progressMap.get(file._id.toString()) || null,
  }));

  return {
    book: {
      id: book._id,
      title: book.title,
      coverImage: book.coverImage,
      author: book.authorId,
      publisher: book.publisherId,
      isPremium: book.isPremium,
      description: book.description,
    },
    files,
  };
};

export const getReadUrlForFile = async (params: ReadUrlParams) => {
  const { userId, bookId, fileId, ttlSeconds } = params;
  await ensureActiveAccess(userId, bookId);

  const book = await Book.findById(bookId).select('title digitalFiles').lean();
  if (!book || !book.digitalFiles || book.digitalFiles.length === 0) {
    throw new Error('Sách không tồn tại hoặc chưa có file ebook');
  }

  const digitalFile = book.digitalFiles.find(
    (file: any) => file._id?.toString() === fileId.toString()
  );

  if (!digitalFile) {
    throw new Error('Không tìm thấy ebook yêu cầu');
  }

  const ttl = Number.isFinite(ttlSeconds) && ttlSeconds! > 0 ? ttlSeconds! : DEFAULT_READ_TTL;
  const downloadInfo = generateEbookDownloadUrl(
    digitalFile.publicId,
    digitalFile.format || 'pdf',
    ttl
  );

  await EbookReadingProgress.findOneAndUpdate(
    {
      user: ensureObjectId(userId, 'userId'),
      book: ensureObjectId(bookId, 'bookId'),
      fileId: ensureObjectId(fileId, 'fileId'),
    },
    {
      $setOnInsert: {
        user: ensureObjectId(userId, 'userId'),
        book: ensureObjectId(bookId, 'bookId'),
        fileId: ensureObjectId(fileId, 'fileId'),
      },
      $set: {
        lastOpenedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return {
    url: downloadInfo.url,
    expiresIn: downloadInfo.expiresIn,
    expiresAt: downloadInfo.expiresAt,
    format: digitalFile.format,
    fileId: digitalFile._id,
    book: {
      id: book._id,
      title: book.title,
    },
  };
};

const clampPercentage = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }
  return Math.max(0, Math.min(100, Number(value)));
};

export const saveReadingProgress = async (params: ProgressParams) => {
  const { userId, bookId, fileId, percentage, currentPage, totalPages, lastLocation, deviceInfo } =
    params;

  await ensureActiveAccess(userId, bookId);

  const updatePayload: any = {
    lastOpenedAt: new Date(),
  };

  const clampedPercentage = clampPercentage(percentage);
  if (typeof clampedPercentage === 'number') {
    updatePayload.percentage = clampedPercentage;
  }

  if (typeof currentPage === 'number') {
    updatePayload.currentPage = currentPage;
  }

  if (typeof totalPages === 'number' && totalPages > 0) {
    updatePayload.totalPages = totalPages;
  }

  if (typeof lastLocation === 'string') {
    updatePayload.lastLocation = lastLocation;
  }

  if (deviceInfo) {
    updatePayload.deviceInfo = deviceInfo;
  }

  const progress = await EbookReadingProgress.findOneAndUpdate(
    {
      user: ensureObjectId(userId, 'userId'),
      book: ensureObjectId(bookId, 'bookId'),
      fileId: ensureObjectId(fileId, 'fileId'),
    },
    {
      $setOnInsert: {
        user: ensureObjectId(userId, 'userId'),
        book: ensureObjectId(bookId, 'bookId'),
        fileId: ensureObjectId(fileId, 'fileId'),
      },
      $set: updatePayload,
    },
    {
      new: true,
      upsert: true,
    }
  ).select('percentage currentPage totalPages lastLocation lastOpenedAt deviceInfo fileId');

  return progress;
};


