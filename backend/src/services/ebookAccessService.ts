import mongoose from 'mongoose';
import EbookAccess, {
  IEbookAccess,
  EbookAccessLevel,
  EbookAccessStatus,
} from '../models/EbookAccess';
import Book from '../models/Book';
import User from '../models/User';

interface GrantAccessParams {
  userId: string;
  bookId: string;
  accessLevel?: EbookAccessLevel;
  expiresAt?: Date;
  grantedBy: string;
  notes?: string;
}

interface UpdateAccessParams {
  id: string;
  accessLevel?: EbookAccessLevel;
  status?: EbookAccessStatus;
  expiresAt?: Date | null;
  notes?: string;
  updatedBy: string;
}

interface ListAccessParams {
  page?: number;
  limit?: number;
  userId?: string;
  bookId?: string;
  status?: EbookAccessStatus;
}

const ACTIVE_STATUS: EbookAccessStatus = 'ACTIVE';

export async function grantEbookAccess(params: GrantAccessParams): Promise<IEbookAccess> {
  const { userId, bookId, accessLevel = 'full', expiresAt, grantedBy, notes } = params;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(bookId)) {
    throw new Error('userId hoặc bookId không hợp lệ');
  }

  const [userExists, book] = await Promise.all([
    User.exists({ _id: userId }),
    Book.findById(bookId).select('digitalFiles title'),
  ]);

  if (!userExists) {
    throw new Error('Không tìm thấy người dùng');
  }

  if (!book) {
    throw new Error('Không tìm thấy sách');
  }

  if (!book.digitalFiles || book.digitalFiles.length === 0) {
    throw new Error('Sách chưa có file ebook để cấp quyền');
  }

  const updatePayload: Partial<IEbookAccess> = {
    accessLevel,
    status: ACTIVE_STATUS,
    grantedBy: new mongoose.Types.ObjectId(grantedBy),
    expiresAt: expiresAt || undefined,
    notes,
  };

  const doc = await EbookAccess.findOneAndUpdate(
    { user: userId, book: bookId },
    {
      $set: updatePayload,
      $unset: {
        revokedBy: '',
        revokedAt: '',
        revokedReason: '',
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).populate('user', 'fullName email').populate('book', 'title isbn coverImage digitalFiles');

  if (!doc) {
    throw new Error('Không thể cấp quyền ebook');
  }

  return doc;
}

export async function updateEbookAccess(params: UpdateAccessParams): Promise<IEbookAccess | null> {
  const { id, accessLevel, status, expiresAt, notes, updatedBy } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('ID quyền truy cập không hợp lệ');
  }

  const update: any = {
    $set: {
      updatedBy: new mongoose.Types.ObjectId(updatedBy),
    },
  };

  if (accessLevel) {
    update.$set.accessLevel = accessLevel;
  }

  if (typeof notes === 'string') {
    update.$set.notes = notes;
  }

  if (expiresAt === null) {
    update.$unset = { ...(update.$unset || {}), expiresAt: '' };
  } else if (expiresAt) {
    update.$set.expiresAt = expiresAt;
  }

  if (status) {
    update.$set.status = status;
    if (status === 'REVOKED') {
      update.$set.revokedBy = new mongoose.Types.ObjectId(updatedBy);
      update.$set.revokedAt = new Date();
    } else {
      update.$unset = { ...(update.$unset || {}), revokedBy: '', revokedAt: '', revokedReason: '' };
    }
  }

  const doc = await EbookAccess.findByIdAndUpdate(
    id,
    update,
    { new: true }
  )
    .populate('user', 'fullName email')
    .populate('book', 'title isbn coverImage digitalFiles');

  return doc;
}

export async function revokeEbookAccess(
  id: string,
  revokedBy: string,
  revokedReason?: string
): Promise<IEbookAccess | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('ID quyền truy cập không hợp lệ');
  }

  return EbookAccess.findByIdAndUpdate(
    id,
    {
      status: 'REVOKED',
      revokedBy: new mongoose.Types.ObjectId(revokedBy),
      revokedAt: new Date(),
      revokedReason,
    },
    { new: true }
  )
    .populate('user', 'fullName email')
    .populate('book', 'title isbn coverImage digitalFiles');
}

export async function listEbookAccess(params: ListAccessParams) {
  const { page = 1, limit = 20, userId, bookId, status } = params;
  const query: any = {};

  if (userId) {
    query.user = userId;
  }
  if (bookId) {
    query.book = bookId;
  }
  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    EbookAccess.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'fullName email')
      .populate('book', 'title isbn coverImage digitalFiles'),
    EbookAccess.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

export async function getActiveEbookAccessByUser(userId: string) {
  return EbookAccess.find({
    user: userId,
    status: ACTIVE_STATUS,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ updatedAt: -1 })
    .populate('book', 'title coverImage digitalFiles authorId')
    .lean();
}

export async function expireEbookAccesses(): Promise<number> {
  const now = new Date();
  const result = await EbookAccess.updateMany(
    {
      status: ACTIVE_STATUS,
      expiresAt: { $lte: now },
    },
    {
      $set: { status: 'EXPIRED' },
    }
  );

  return result.modifiedCount;
}

