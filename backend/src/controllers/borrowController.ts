import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Borrow from '../models/Borrow';
import Book from '../models/Book';
import User from '../models/User';
import MembershipSubscription from '../models/MembershipSubscription';
import MembershipPlan from '../models/MembershipPlan';
import {
  validateBorrowingPermission,
  validateRentalPermission,
  getBorrowingInfo,
  createBorrow,
  returnBook,
  renewBorrow,
  canRenewBorrow,
  createRentalPaymentLink,
  createRentalBorrow,
  calculateLateFeesAutomatically
} from '../services/borrowService';
import { sendManualReminderEmail, sendBorrowSuccessEmail } from '../services/emailService';
import { recordViolation } from '../services/violationService';
import {
  BOOK_CONDITION,
  calculateDamageFeeByCondition,
  normalizeBookCondition
} from '../utils/borrowingConstants';

interface AuthRequest extends Request {
  user?: any;
}

// GET /borrows/stats/last-30-days - public borrow count
export const getPublicBorrowCountLast30Days = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    const totalBorrowsLast30Days = await Borrow.countDocuments({
      borrowDate: { $gte: last30Days, $ne: null }
    });

    return res.status(200).json({
      success: true,
      data: { totalBorrowsLast30Days }
    });
  } catch (error: any) {
    console.error('Error in getPublicBorrowCountLast30Days:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * POST /api/borrows
 * Tạo yêu cầu mượn sách (Pending status)
 */
export const borrowBook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { bookId, borrowType = 'Membership', rentalDays } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID sách'
      });
    }

    // Kiểm tra sách có tồn tại và còn trong kho không
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    if (book.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sách hiện không còn trong kho'
      });
    }

    // Kiểm tra user có đang có yêu cầu pending cho sách này không
    const existingPending = await Borrow.findOne({
      user: userId,
      book: bookId,
      status: 'Pending'
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có yêu cầu mượn sách này đang chờ xử lý'
      });
    }

    // ============ AUTO-APPROVE FOR MEMBERSHIP BORROW ============
    if (borrowType === 'Membership') {
      try {
        // Use the service function which includes all validations
        const borrow = await createBorrow(userId, bookId);
        
        return res.status(201).json({
          success: true,
          message: 'Mượn sách thành công! Bạn có thể đến thư viện lấy sách.',
          data: {
            borrow: {
              _id: borrow._id,
              id: borrow._id,
              book: borrow.book,
              user: borrow.user,
              borrowType: borrow.borrowType,
              status: borrow.status,
              borrowDate: borrow.borrowDate,
              dueDate: borrow.dueDate,
              maxRenewals: borrow.maxRenewals,
              createdAt: borrow.createdAt
            }
          }
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: error.message || 'Không đáp ứng điều kiện mượn'
        });
      }
    }

    // ============ RENTAL BORROW - Keep Pending Status ============
    // Validate rental permission using the service function
    const rentalValidation = await validateRentalPermission(userId, bookId, rentalDays || 0);
    if (!rentalValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Không đáp ứng điều kiện mượn lẻ',
        errors: rentalValidation.errors
      });
    }

    // Tạo borrow request với status Pending
    const borrow = new Borrow({
      user: userId,
      book: bookId,
      borrowType,
      rentalDays: rentalDays || undefined,
      status: 'Pending',
      renewalCount: 0,
      maxRenewals: 1, // Default, sẽ được cập nhật khi approve
      lateFee: 0,
      damageFee: 0
    });

    await borrow.save();

    // Populate để trả về thông tin đầy đủ
    await borrow.populate('book', 'title coverImage isbn');
    await borrow.populate('user', 'fullName email');

    return res.status(201).json({
      success: true,
      message: 'Yêu cầu mượn sách đã được gửi, vui lòng chờ thủ thư xác nhận',
      data: {
        borrow: {
          _id: borrow._id,
          id: borrow._id,
          book: borrow.book,
          user: borrow.user,
          borrowType: borrow.borrowType,
          status: borrow.status,
          rentalDays: borrow.rentalDays,
          createdAt: borrow.createdAt
        }
      }
    });
  } catch (error: any) {
    console.error('Error in borrowBook:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo yêu cầu mượn sách'
    });
  }
};

/**
 * POST /api/borrows/validate
 * Kiểm tra điều kiện mượn mà không tạo phiếu mượn
 */
export const validateBorrowEligibility = async (req: AuthRequest, res: Response) => {
  try {
    const actor = (req as any).user;
    const actorUserId = actor?.userId;
    const actorRole = String(actor?.role || '').toLowerCase();
    const { bookId, userId } = req.body as { bookId?: string; userId?: string };

    if (!bookId || typeof bookId !== 'string' || !bookId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID sách (bookId)',
        errors: ['Thiếu bookId'],
      });
    }

    let targetUserId = actorUserId;

    if (userId && typeof userId === 'string' && userId.trim()) {
      if (['admin', 'librarian'].includes(actorRole)) {
        targetUserId = userId.trim();
      } else if (userId !== actorUserId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền kiểm tra quyền mượn của người dùng khác',
        });
      }
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Không xác định được người dùng cần kiểm tra',
      });
    }

    const validation = await validateBorrowingPermission(targetUserId, bookId.trim());

    return res.status(200).json({
      success: validation.isValid,
      message: validation.isValid ? 'Đủ điều kiện mượn' : 'Không đáp ứng điều kiện mượn',
      data: validation,
    });
  } catch (error: any) {
    console.error('Error in validateBorrowEligibility:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi kiểm tra điều kiện mượn',
    });
  }
};

/**
 * GET /api/borrows/me
 * Lấy danh sách sách đang mượn của user hiện tại
 */
export const getMyBorrows = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let query: any = { user: userId };
    if (status) query.status = status;

    const borrows = await Borrow.find(query)
      .populate('book', 'title coverImage isbn authorId category')
      .populate('user', 'fullName email')
      .sort({ borrowDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Borrow.countDocuments(query);

    const borrowsWithDetails = borrows.map((borrow) => {
      const borrowObj = borrow.toObject();
      let daysLate = 0;
      if (borrow.status === 'Borrowed' || borrow.status === 'Overdue') {
        if (borrow.dueDate < new Date()) {
          daysLate = Math.floor((Date.now() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      } else if (borrow.status === 'Returned' && borrow.returnDate) {
        daysLate = Math.floor(
          (borrow.returnDate.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        ...borrowObj,
        daysLate: Math.max(0, daysLate)
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        borrows: borrowsWithDetails,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getMyBorrows:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách mượn sách'
    });
  }
};

/**
 * GET /api/borrows/me/current
 * Lấy số sách đang mượn và thông tin quyền mượn
 */
export const getMyBorrowingInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const info = await getBorrowingInfo(userId);
    return res.status(200).json({ success: true, data: info });
  } catch (error: any) {
    console.error('Error in getMyBorrowingInfo:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin mượn sách'
    });
  }
};

/**
 * POST /api/borrows/payment-link
 * Tạo payment link cho mượn lẻ
 */
export const createRentalPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { bookId, rentalDays } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID sách' });
    }
    if (!Number.isInteger(rentalDays)) {
      return res.status(400).json({ success: false, message: 'rentalDays là bắt buộc (1-7)' });
    }
    const payment = await createRentalPaymentLink(userId, bookId, Number(rentalDays));
    // Map response để match với FE interface: { data: { paymentLink, paymentId, amount, expiresAt } }
    let expiresAtStr = '';
    if (payment.expiresAt) {
      if (payment.expiresAt instanceof Date) {
        expiresAtStr = payment.expiresAt.toISOString();
      } else {
        expiresAtStr = new Date(payment.expiresAt).toISOString();
      }
    }
    
    return res.status(201).json({ 
      success: true, 
      data: { 
        paymentLink: payment.checkoutUrl,
        paymentId: payment.paymentId,
        amount: payment.amount,
        expiresAt: expiresAtStr
      } 
    });
  } catch (error: any) {
    console.error('Error in createRentalPayment:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Không thể tạo payment link'
    });
  }
};

/**
 * GET /api/borrows/:id
 * Lấy chi tiết một phiếu mượn
 */
export const getBorrowById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const borrow = await Borrow.findById(id)
      .populate('book')
      .populate('user', 'fullName email');

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu mượn'
      });
    }

    // Kiểm tra quyền: user có thể là ObjectId hoặc đã được populate
    // Nếu đã populate, borrow.user là object có _id, nếu chưa thì là ObjectId
    const borrowUserId = (borrow.user as any)?._id 
      ? String((borrow.user as any)._id) 
      : String(borrow.user);
    
    const isOwner = borrowUserId === userId;
    const isAdmin = (req as any).user?.role === 'Admin' || (req as any).user?.role === 'Librarian';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem phiếu mượn này'
      });
    }

    let daysLate = 0;
    if (borrow.status === 'Borrowed' || borrow.status === 'Overdue') {
      if (borrow.dueDate < new Date()) {
        daysLate = Math.floor((Date.now() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else if (borrow.status === 'Returned' && borrow.returnDate) {
      daysLate = Math.floor(
        (borrow.returnDate.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const borrowObj = borrow.toObject();

    return res.status(200).json({
      success: true,
      data: {
        ...borrowObj,
        daysLate: Math.max(0, daysLate)
      }
    });
  } catch (error: any) {
    console.error('Error in getBorrowById:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy chi tiết phiếu mượn'
    });
  }
};

/**
 * POST /api/borrows/:id/request-return
 * Reader yêu cầu trả sách (Borrowed/Overdue -> ReturnRequested)
 */
export const requestReturn = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { notes } = req.body;

    const borrow = await Borrow.findById(id).populate('book user');
    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu mượn'
      });
    }

    // Kiểm tra quyền sở hữu
    const borrowUserId = String((borrow.user as any)._id || borrow.user);
    if (borrowUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này'
      });
    }

    // Kiểm tra status hợp lệ
    if (borrow.status !== 'Borrowed' && borrow.status !== 'Overdue') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể yêu cầu trả sách đang mượn hoặc quá hạn'
      });
    }

    // Cập nhật status
    borrow.status = 'ReturnRequested';
    if (notes) {
      borrow.notes = notes;
    }

    await borrow.save();

    return res.status(200).json({
      success: true,
      message: 'Yêu cầu trả sách đã được gửi, vui lòng đến thư viện để trả sách',
      data: {
        borrow: {
          id: borrow._id,
          status: borrow.status,
          notes: borrow.notes
        }
      }
    });
  } catch (error: any) {
    console.error('Error in requestReturn:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi yêu cầu trả sách'
    });
  }
};

/**
 * POST /api/borrows/:id/return
 * Librarian xác nhận trả sách (ReturnRequested/Borrowed/Overdue -> Returned)
 */
export const returnBorrowedBook = async (req: AuthRequest, res: Response) => {
  try {
    const staffUserId = (req as any).user?.userId;
    const staffRole = (req as any).user?.role;
    const { id } = req.params;
    const { bookCondition, notes } = req.body;

    // Debug: log thông tin user
    console.log('Return book request:', {
      staffUserId,
      staffRole,
      borrowId: id,
      userFromReq: (req as any).user
    });

    // Kiểm tra role trước khi gọi service
    if (!staffRole) {
      return res.status(403).json({
        success: false,
        message: 'Không tìm thấy thông tin quyền truy cập'
      });
    }

    // Admin/Librarian có thể trả sách của bất kỳ user nào
    const borrow = await returnBook(id, staffUserId, staffRole, bookCondition, notes);

    return res.status(200).json({
      success: true,
      message: 'Trả sách thành công',
      data: {
        borrow: {
          id: borrow._id,
          returnDate: borrow.returnDate,
          lateFee: borrow.lateFee,
          damageFee: borrow.damageFee,
          totalFee: borrow.lateFee + borrow.damageFee,
          status: borrow.status
        }
      }
    });
  } catch (error: any) {
    console.error('Error in returnBorrowedBook:', error);
    const errorMessage = error.message || 'Lỗi khi trả sách';
    
    if (errorMessage.includes('không tồn tại') || errorMessage.includes('Không tìm thấy')) {
      return res.status(404).json({ success: false, message: errorMessage });
    }
    if (errorMessage.includes('không có quyền') || errorMessage.includes('Chỉ Admin/Librarian')) {
      return res.status(403).json({ success: false, message: errorMessage });
    }
    if (errorMessage.includes('đã được trả')) {
      return res.status(400).json({ success: false, message: errorMessage });
    }
    return res.status(500).json({ success: false, message: errorMessage });
  }
};

/**
 * POST /api/borrows/:id/renew
 * Gia hạn mượn sách
 */
export const renewBorrowedBook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const validation = await canRenewBorrow(id, userId);
    if (!validation.canRenew) {
      return res.status(400).json({
        success: false,
        message: validation.reason || 'Không thể gia hạn'
      });
    }

    const borrow = await renewBorrow(id, userId);

    // Populate book and user info for complete response
    await borrow.populate('book', 'title isbn coverImage category');
    await borrow.populate('user', 'fullName email');

    return res.status(200).json({
      success: true,
      message: 'Gia hạn thành công',
      data: {
        borrow
      }
    });
  } catch (error: any) {
    console.error('Error in renewBorrowedBook:', error);
    if (error.message.includes('không tồn tại') || error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi gia hạn'
    });
  }
};

/**
 * GET /api/borrows (Admin/Librarian only)
 * Lấy danh sách tất cả phiếu mượn
 */
export const getAllBorrows = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId, userName, bookId, search, startDate, endDate, page = 1, limit = 10, sort = 'borrowDate', order = 'desc' } =
      req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let query: any = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (bookId) query.book = bookId;
    
    // Handle date range filtering
    if (startDate || endDate) {
      query.borrowDate = {};
      if (startDate) {
        // Parse startDate and set to beginning of the day
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        query.borrowDate.$gte = start;
      }
      if (endDate) {
        // Parse endDate and set to end of the day
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.borrowDate.$lte = end;
      }
    }
    
    // Handle user name filtering
    if (userName && typeof userName === 'string') {
      // Find users by name first
      const users = await User.find({
        fullName: { $regex: userName, $options: 'i' }
      }).select('_id');
      
      // Get user IDs
      const userIds = users.map(user => user._id);
      
      // Add to query
      query.user = { $in: userIds };
    }
    
    // Handle general search term
    if (search && typeof search === 'string') {
      // Find users by name or email
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');      
      // Find books by title or ISBN
      const books = await Book.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { isbn: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');      
      // Get user and book IDs
      const userIds = users.map(user => user._id);
      const bookIds = books.map(book => book._id);
      
      // Add to query with $or condition
      query.$or = [
        { user: { $in: userIds } },
        { book: { $in: bookIds } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sort as string] = sortOrder;

    // Lấy tất cả các borrow với điều kiện lọc
    const allBorrows = await Borrow.find(query)
      .populate('book', 'title coverImage isbn')
      .populate('user', 'fullName email')
      .sort(sortObj)
      .lean();

    // Lọc các borrow hợp lệ (có book và user)
    const validBorrows = allBorrows.filter((b: any) => b.book && b.user);
    
    // Tính toán phân trang dựa trên các borrow hợp lệ
    const total = validBorrows.length;
    const paginatedBorrows = validBorrows.slice(skip, skip + Number(limit));

    return res.status(200).json({
      success: true,
      data: {
        borrows: paginatedBorrows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getAllBorrows:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách mượn sách'
    });
  }
};
/**
 * GET /api/borrows/history
 * Lấy lịch sử mượn của người dùng
 */
export const listMyBorrowHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const borrows = await Borrow.find({ user: userId })
      .populate('book')
      .sort({ createdAt: -1 });

    return res.status(200).json({ borrows });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch borrow history', error: error.message });
  }
};

/**
 * POST /api/borrows/calculate-late-fees
 * Tính phạt trễ hạn tự động cho tất cả sách quá hạn
 * Chỉ dành cho Admin hoặc hệ thống
 */
export const calculateLateFees = async (req: AuthRequest, res: Response) => {
  try {
    const result = await calculateLateFeesAutomatically();

    return res.status(200).json({
      success: true,
      message: 'Tính phạt trễ hạn tự động thành công',
      data: {
        summary: {
          totalProcessed: result.totalProcessed,
          totalUpdated: result.totalUpdated,
          totalLateFee: result.totalLateFee
        },
        details: result.details
      }
    });
  } catch (error: any) {
    console.error('Error in calculateLateFees:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tính phạt trễ hạn tự động'
    });
  }
};

/**
 * POST /api/borrows/:id/send-reminder
 * Gửi thông báo nhắc nhở thủ công cho một phiếu mượn (Admin/Librarian only)
 */
export const sendReminderForBorrow = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customMessage } = req.body;

    const borrow = await Borrow.findById(id);
    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu mượn'
      });
    }

    if (borrow.status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'Không thể gửi nhắc nhở cho sách đã được trả'
      });
    }

    const result = await sendManualReminderEmail(id, customMessage);

    return res.status(200).json({
      success: true,
      message: 'Đã gửi thông báo nhắc nhở thành công',
      data: result
    });
  } catch (error: any) {
    console.error('Error in sendReminderForBorrow:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo nhắc nhở'
    });
  }
};

/**
 * POST /api/borrows/:id/mark-lost
 * Staff đánh dấu sách là mất
 */
export const markBookAsLost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const staffId = (req as any).user?.userId;

    // Check staff role
    const staff = await User.findById(staffId);
    if (!staff || (staff.role !== 'Admin' && staff.role !== 'Librarian')) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ staff mới có quyền thực hiện'
      });
    }

    const session = await mongoose.startSession();
    try {
      let borrow: any;

      await session.withTransaction(async () => {
        borrow = await Borrow.findById(id).populate('book user').session(session);

        if (!borrow) {
          throw new Error('Không tìm thấy phiếu mượn');
        }

        if (borrow.status === 'Returned' || borrow.status === 'Lost') {
          throw new Error('Sách đã được trả hoặc đã đánh dấu mất rồi');
        }

        const book = borrow.book as any;
        if (!book) {
          throw new Error('Không tìm thấy thông tin sách');
        }
        const lostCondition = BOOK_CONDITION.LOST;
        const damageFee = calculateDamageFeeByCondition(lostCondition, book.price);

        // Update borrow
        borrow.status = 'Lost';
        borrow.damageFee = damageFee;
        borrow.returnDate = new Date();
        borrow.processedBy = staffId;
        borrow.notes = notes || `Đánh dấu mất bởi staff ${staff.fullName}`;
        await borrow.save({ session });

        // Giảm stock (không tăng available vì sách đã mất)
        await Book.updateOne(
          { _id: borrow.book },
          { $inc: { stock: -1 } },
          { session }
        );

        // Update user debt
        const user = await User.findById(borrow.user).session(session);
        if (user) {
          user.debt = (user.debt || 0) + damageFee;
          user.debtLastUpdated = new Date();
          user.totalSpent += damageFee;
          await user.save({ session });
        }
      });

      // Record violation (ngoài transaction)
      try {
        await recordViolation(
          borrow.user.toString(),
          'Lost',
          borrow._id.toString(),
          'High',
          `Đánh dấu mất bởi staff ${staff.fullName}`
        );
      } catch (error) {
        console.error('Failed to record violation:', error);
      }

      // Populate lại để trả về
      borrow = await Borrow.findById(id).populate('book user');

      return res.status(200).json({
        success: true,
        message: 'Đã đánh dấu sách là mất',
        data: {
          borrow,
          damageFee: borrow.damageFee,
          bookCondition: BOOK_CONDITION.LOST
        }
      });
    } catch (error: any) {
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    console.error('Error in markBookAsLost:', error);
    if (error.message.includes('không tồn tại') || error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('đã được trả') || error.message.includes('đã đánh dấu')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi đánh dấu sách là mất'
    });
  }
};

/**
 * POST /api/borrows/send-reminders/batch
 * Gửi thông báo nhắc nhở cho nhiều phiếu mượn cùng lúc (Admin/Librarian only)
 */
export const sendBatchReminders = async (req: AuthRequest, res: Response) => {
  try {
    const { borrowIds, customMessage } = req.body;

    if (!borrowIds || !Array.isArray(borrowIds) || borrowIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách ID phiếu mượn (borrowIds)'
      });
    }

    if (borrowIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Không thể gửi nhắc nhở cho quá 50 phiếu mượn cùng lúc'
      });
    }

    const results = {
      success: [] as any[],
      failed: [] as any[]
    };

    for (const borrowId of borrowIds) {
      try {
        const borrow = await Borrow.findById(borrowId);
        if (!borrow) {
          results.failed.push({ borrowId, error: 'Không tìm thấy phiếu mượn' });
          continue;
        }

        if (borrow.status === 'Returned') {
          results.failed.push({ borrowId, error: 'Sách đã được trả' });
          continue;
        }

        const result = await sendManualReminderEmail(borrowId, customMessage);
        results.success.push(result);
      } catch (error: any) {
        results.failed.push({
          borrowId,
          error: error.message || 'Lỗi khi gửi email'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã gửi ${results.success.length}/${borrowIds.length} thông báo nhắc nhở`,
      data: {
        total: borrowIds.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        success: results.success,
        failed: results.failed
      }
    });
  } catch (error: any) {
    console.error('Error in sendBatchReminders:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi thông báo nhắc nhở hàng loạt'
    });
  }
};

/**
 * POST /api/borrows/:id/mark-damaged
 * Staff đánh dấu sách bị hư hỏng
 */
export const markBookAsDamaged = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { damageLevel, notes } = req.body;
    const staffId = (req as any).user?.userId;

    // Check staff role
    const staff = await User.findById(staffId);
    if (!staff || (staff.role !== 'Admin' && staff.role !== 'Librarian')) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ staff mới có quyền thực hiện'
      });
    }

    const normalizedDamageLevel = normalizeBookCondition(damageLevel);
    const isAllowedDamageCondition =
      normalizedDamageLevel === BOOK_CONDITION.DAMAGED ||
      normalizedDamageLevel === BOOK_CONDITION.SEVERELY_DAMAGED;

    if (!damageLevel || !isAllowedDamageCondition) {
      return res.status(400).json({
        success: false,
        message: 'Mức độ hư hỏng không hợp lệ (Damaged hoặc SeverelyDamaged)'
      });
    }

    const session = await mongoose.startSession();
    try {
      let borrow: any;

      await session.withTransaction(async () => {
        borrow = await Borrow.findById(id).populate('book user').session(session);

        if (!borrow) {
          throw new Error('Không tìm thấy phiếu mượn');
        }

        if (borrow.status === 'Returned' || borrow.status === 'Damaged' || borrow.status === 'Lost') {
          throw new Error('Sách đã được xử lý rồi');
        }

        const book = borrow.book as any;
        if (!book) {
          throw new Error('Không tìm thấy thông tin sách');
        }
        const damageFee = calculateDamageFeeByCondition(normalizedDamageLevel, book.price);

        // Update borrow
        borrow.status = 'Damaged';
        borrow.damageFee = damageFee;
        borrow.returnDate = new Date();
        borrow.processedBy = staffId;
        borrow.notes = notes || `Đánh dấu hư hỏng (${normalizedDamageLevel}) bởi staff ${staff.fullName}`;
        await borrow.save({ session });

        // Tăng available (sách vẫn còn, chỉ bị hỏng)
        await Book.updateOne(
          { _id: borrow.book },
          { $inc: { available: 1 } },
          { session }
        );

        // Update user debt
        const user = await User.findById(borrow.user).session(session);
        if (user) {
          user.debt = (user.debt || 0) + damageFee;
          user.debtLastUpdated = new Date();
          user.totalSpent += damageFee;
          await user.save({ session });
        }
      });

      // Record violation (ngoài transaction)
      try {
        await recordViolation(
          borrow.user.toString(),
          'Damaged',
          borrow._id.toString(),
          'High',
          `Đánh dấu hư hỏng (${normalizedDamageLevel}) bởi staff ${staff.fullName}`
        );
      } catch (error) {
        console.error('Failed to record violation:', error);
      }

      // Populate lại để trả về
      borrow = await Borrow.findById(id).populate('book user');

      return res.status(200).json({
        success: true,
        message: 'Đã đánh dấu sách bị hư hỏng',
        data: {
          borrow,
          damageFee: borrow.damageFee,
          damageLevel: normalizedDamageLevel
        }
      });
    } catch (error: any) {
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error: any) {
    console.error('Error in markBookAsDamaged:', error);
    if (error.message.includes('không tồn tại') || error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('đã được xử lý')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi đánh dấu sách bị hư hỏng'
    });
  }
};

/**
 * POST /api/borrows/:id/approve
 * Librarian chấp nhận yêu cầu mượn sách (Pending -> Borrowed)
 */
export const approveBorrowRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const staffId = (req as any).user?.userId;

    const borrow = await Borrow.findById(id).populate('book user');
    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mượn sách'
      });
    }

    if (borrow.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu này đã được xử lý hoặc không ở trạng thái chờ'
      });
    }

    const book = borrow.book as any;
    const user = await User.findById(borrow.user).populate('membershipPlanId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Kiểm tra sách còn available không
    if (book.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sách hiện không còn trong kho'
      });
    }

    // Lấy borrowing rules dựa trên membership
    const membershipPlan = user.membershipPlanId as any;
    let borrowDays = 14; // Default
    let maxRenewals = 1; // Default

    if (membershipPlan) {
      if (membershipPlan.name === 'Premium') {
        borrowDays = 30;
        maxRenewals = 3;
      } else {
        borrowDays = 14;
        maxRenewals = 1;
      }
    }

    // Nếu là Rental, dùng rentalDays
    if (borrow.borrowType === 'Rental' && borrow.rentalDays) {
      borrowDays = borrow.rentalDays;
      maxRenewals = 0; // Rental không được gia hạn
    }

    // Cập nhật borrow
    borrow.status = 'Borrowed';
    borrow.borrowDate = new Date();
    borrow.dueDate = new Date(Date.now() + borrowDays * 24 * 60 * 60 * 1000);
    borrow.maxRenewals = maxRenewals;
    borrow.processedBy = staffId;

    await borrow.save();

    // Giảm số lượng available
    await Book.updateOne(
      { _id: borrow.book },
      { $inc: { available: -1 } }
    );

    // Gửi email thông báo cho user (optional)
    try {
      await sendBorrowSuccessEmail(String(borrow._id));
    } catch (emailError) {
      console.error('Failed to send borrow success email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Đã chấp nhận yêu cầu mượn sách',
      data: {
        borrow: {
          id: borrow._id,
          user: borrow.user,
          book: borrow.book,
          borrowDate: borrow.borrowDate,
          dueDate: borrow.dueDate,
          status: borrow.status,
          borrowType: borrow.borrowType,
          maxRenewals: borrow.maxRenewals
        }
      }
    });
  } catch (error: any) {
    console.error('Error in approveBorrowRequest:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi chấp nhận yêu cầu mượn sách'
    });
  }
};

/**
 * POST /api/borrows/:id/reject
 * Librarian từ chối yêu cầu mượn sách (Pending -> Cancelled)
 */
export const rejectBorrowRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const staffId = (req as any).user?.userId;

    const borrow = await Borrow.findById(id).populate('book user');
    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mượn sách'
      });
    }

    if (borrow.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu này đã được xử lý hoặc không ở trạng thái chờ'
      });
    }

    // Cập nhật borrow
    borrow.status = 'Cancelled';
    borrow.notes = reason || 'Yêu cầu bị từ chối bởi thủ thư';
    borrow.processedBy = staffId;

    await borrow.save();

    return res.status(200).json({
      success: true,
      message: 'Đã từ chối yêu cầu mượn sách',
      data: {
        borrow: {
          id: borrow._id,
          status: borrow.status,
          notes: borrow.notes
        }
      }
    });
  } catch (error: any) {
    console.error('Error in rejectBorrowRequest:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi từ chối yêu cầu mượn sách'
    });
  }
};
