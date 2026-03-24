import { Request, Response } from 'express';
import Reservation from '../models/Reservation';
import Book from '../models/Book';
import User from '../models/User';
import Borrow from '../models/Borrow';
import { 
  createReservation, 
  approveReservation, 
  cancelReservation, 
  fulfillReservation,
  expireReservations
} from '../services/reservationService';
import { sendReservationRejectedEmail } from '../services/emailService';
import { getBorrowingRules, MembershipType } from '../utils/borrowingConstants';

export const createReservationHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }
    
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: 'bookId là bắt buộc' });
    }

    const reservation = await createReservation(userId, bookId);
    
    return res.status(201).json({ 
      message: 'Đặt trước sách thành công', 
      reservation 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Không thể tạo đặt trước sách', 
      error: error.message 
    });
  }
};

export const listMyReservations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }
    
    const reservations = await Reservation.find({ user: userId })
      .populate('book')
      .sort({ createdAt: -1 });
      
    return res.status(200).json({ reservations });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Không thể lấy danh sách đặt trước', 
      error: error.message 
    });
  }
};

export const listAllReservations = async (req: Request, res: Response) => {
  try {
    const { status, bookId } = req.query;
    
    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (bookId) filter.book = bookId;
    
    const reservations = await Reservation.find(filter)
      .populate('book')
      .populate('user')
      .sort({ createdAt: -1 });
      
    return res.status(200).json({ reservations });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Không thể lấy danh sách đặt trước', 
      error: error.message 
    });
  }
};

export const getReservationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const reservation = await Reservation.findById(id)
      .populate('book')
      .populate('user');
      
    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đặt trước' });
    }
    
    // Check permissions - user can only see their own reservations unless they're admin/librarian
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'Admin' && userRole !== 'Librarian' && 
        reservation.user.toString() !== userId) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    return res.status(200).json({ reservation });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Không thể lấy thông tin đặt trước', 
      error: error.message 
    });
  }
};

export const approveReservationHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const librarianId = (req as any).user?.userId;
    
    if (!librarianId) {
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }
    
    const reservation = await approveReservation(id, librarianId);
    
    return res.status(200).json({ 
      message: 'Duyệt đặt trước thành công', 
      reservation 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Không thể duyệt đặt trước', 
      error: error.message 
    });
  }
};

export const cancelReservationHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }
    
    const { id } = req.params;
    
    // Debug: Log userId để kiểm tra
    console.log(`[cancelReservationHandler] UserId from request: ${userId} (type: ${typeof userId})`);
    console.log(`[cancelReservationHandler] ReservationId: ${id}`);
    
    const reservation = await cancelReservation(id, userId);
    
    return res.status(200).json({ 
      message: 'Hủy đặt trước thành công', 
      reservation 
    });
  } catch (error: any) {
    console.error(`[cancelReservationHandler] Error:`, error);
    return res.status(500).json({ 
      message: 'Không thể hủy đặt trước', 
      error: error.message 
    });
  }
};

export const cancelReservationByLibrarian = async (req: Request, res: Response) => {
  try {
    const librarianId = (req as any).user?.userId;
    if (!librarianId) {
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }
    
    const { id } = req.params;
    
    const reservation = await cancelReservation(id);
    
    return res.status(200).json({ 
      message: 'Hủy đặt trước thành công', 
      reservation 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Không thể hủy đặt trước', 
      error: error.message 
    });
  }
};

export const fulfillReservationHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { reservation, borrow } = await fulfillReservation(id);
    
    return res.status(200).json({ 
      message: 'Hoàn thành đặt trước thành công', 
      reservation,
      borrow
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Không thể hoàn thành đặt trước', 
      error: error.message 
    });
  }
};

export const rejectReservation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Kiểm tra reason có tồn tại và không rỗng
    if (reason === undefined || reason === null) {
      return res.status(400).json({ 
        message: 'Lý do từ chối là bắt buộc',
        error: 'Vui lòng cung cấp lý do từ chối đặt trước'
      });
    }
    
    const reasonStr = String(reason).trim();
    if (reasonStr.length === 0) {
      return res.status(400).json({ 
        message: 'Lý do từ chối không được để trống',
        error: 'Vui lòng nhập lý do từ chối đặt trước'
      });
    }
    
    if (reasonStr.length > 300) {
      return res.status(400).json({ 
        message: 'Lý do từ chối quá dài',
        error: 'Lý do từ chối không được vượt quá 300 ký tự'
      });
    }
    
    const reservation = await Reservation.findById(id).populate('book').populate('user');
    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đặt trước' });
    }
    
    if (reservation.status !== 'Pending') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối đặt trước ở trạng thái Pending' });
    }
    
    // Get librarian ID from request
    const librarianId = (req as any).user?.userId;
    
    // Update status and reason
    (reservation as any).status = 'Rejected';
    (reservation as any).rejectionReason = reasonStr;
    (reservation as any).rejectedBy = librarianId;
    await (reservation as any).save();
    
    // Notify user via email if possible
    const populatedUser = (reservation as any).user as any;
    const populatedBook = (reservation as any).book as any;
    if (populatedUser && populatedUser.email) {
      try {
        await sendReservationRejectedEmail(
          populatedUser.email,
          populatedBook?.title || 'Sách',
          reasonStr
        );
      } catch (_mailErr) {
        // Không chặn response nếu email lỗi
      }
    }
    
    return res.status(200).json({
      message: 'Reservation đã bị từ chối',
      reservation,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Không thể từ chối đặt trước', error: error.message });
  }
};

export const expireReservationsHandler = async (_req: Request, res: Response) => {
  try {
    const result = await expireReservations();
    
    return res.status(200).json({ 
      message: `Đã hết hạn ${result.totalExpired} đặt trước`,
      result
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: 'Không thể xử lý đặt trước hết hạn', 
      error: error.message 
    });
  }
};