import { Request, Response } from 'express';
import { getUserDebtInfo, applyExternalDebtPayment, createManualDebtPaymentRequest } from '../services/debtService';
import DebtPayment from '../models/DebtPayment';
import Payment from '../models/Payment';
import User from '../models/User';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * GET /api/payments/debt/info
 * Lấy thông tin nợ của user hiện tại
 */
export const getDebtInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const debtInfo = await getUserDebtInfo(userId);
    return res.status(200).json({
      success: true,
      data: debtInfo
    });
  } catch (error: any) {
    console.error('Error in getDebtInfo:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin nợ'
    });
  }
};

/**
 * POST /api/payments/debt/pay
 * Tạo yêu cầu thanh toán nợ phí phạt thủ công (chờ Librarian duyệt)
 */
export const payDebt = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { amount, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const parsedAmount =
      typeof amount === 'string' ? Number(amount) : amount;

    if (!parsedAmount || typeof parsedAmount !== 'number' || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không hợp lệ'
      });
    }

    const paymentRequest = await createManualDebtPaymentRequest(userId, parsedAmount, notes);

    return res.status(200).json({
      success: true,
      message: 'Tạo yêu cầu thanh toán thành công. Vui lòng đến thư viện và thanh toán tiền mặt cho thủ thư.',
      data: {
        paymentRequest: {
          id: paymentRequest.paymentRequest._id,
          amount: paymentRequest.paymentRequest.amount,
          status: paymentRequest.paymentRequest.status,
          createdAt: paymentRequest.paymentRequest.createdAt
        },
        debtPreview: {
          before: paymentRequest.debtBefore,
          after: paymentRequest.debtAfterEstimate
        },
        debtInfo: await getUserDebtInfo(userId)
      }
    });
  } catch (error: any) {
    console.error('Error in payDebt:', error);
    if (
      error.message &&
      (
        error.message.includes('không có nợ') ||
        error.message.includes('không hợp lệ') ||
        error.message.includes('Người dùng không tồn tại')
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo yêu cầu thanh toán nợ'
    });
  }
};

/**
 * GET /api/payments/debt/history
 * Lịch sử thanh toán nợ của user
 */
export const getDebtHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      DebtPayment.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DebtPayment.countDocuments({ user: userId })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getDebtHistory:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch sử thanh toán'
    });
  }
};

/**
 * POST /api/payments/debt/confirm
 * Xác nhận thanh toán phí bồi thường (dùng khi webhook không tới - chỉ cho PayOS)
 * Lưu ý: Đây chỉ dùng cho các giao dịch PayOS cũ, không dùng cho Manual payment
 */
export const confirmDebtPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { providerRef, paymentId } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!providerRef && !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp providerRef hoặc paymentId'
      });
    }

    const payment = await Payment.findOne({
      user: userId,
      type: 'Debt',
      ...(providerRef ? { providerRef } : {}),
      ...(paymentId ? { _id: paymentId } : {})
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu thanh toán'
      });
    }

    if (payment.status === 'Failed' || payment.status === 'Canceled') {
      return res.status(400).json({
        success: false,
        message: 'Thanh toán đã thất bại hoặc bị hủy, vui lòng tạo giao dịch mới'
      });
    }

    let paymentResult = null;
    if (payment.status !== 'Succeeded') {
      paymentResult = await applyExternalDebtPayment(userId, payment.amount, {
        method: 'PayOS',
        metadata: {
          providerRef: payment.providerRef,
          paymentId: payment._id,
          source: 'ManualDebtConfirmation'
        }
      });
      payment.status = 'Succeeded';
      payment.metadata = {
        ...(payment.metadata || {}),
        manuallyConfirmedAt: new Date(),
        manuallyConfirmedBy: userId
      };
      await payment.save();
    }

    return res.status(200).json({
      success: true,
      message: paymentResult
        ? 'Đã xác nhận thanh toán thành công'
        : 'Thanh toán đã được xử lý trước đó',
      data: {
        payment: {
          id: payment._id,
          providerRef: payment.providerRef,
          amount: payment.amount,
          status: payment.status
        },
        settlement: paymentResult,
        debtInfo: await getUserDebtInfo(userId)
      }
    });
  } catch (error: any) {
    console.error('Error in confirmDebtPayment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xác nhận thanh toán nợ'
    });
  }
};

/**
 * GET /api/payments/debt/pending (Librarian/Admin)
 * Lấy danh sách yêu cầu thanh toán nợ đang chờ duyệt
 */
export const getPendingDebtPayments = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = (req as any).user?.userId;
    if (!staffId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status as string || 'Pending';

    const filter: any = {};
    if (['Pending', 'Approved', 'Rejected'].includes(status)) {
      filter.status = status;
    }

    const [requests, total] = await Promise.all([
      DebtPayment.find(filter)
        .populate('user', 'fullName email phoneNumber debt')
        .populate('processedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DebtPayment.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getPendingDebtPayments:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách yêu cầu thanh toán'
    });
  }
};

/**
 * POST /api/payments/debt/:id/approve (Librarian/Admin)
 * Duyệt yêu cầu thanh toán nợ (sau khi nhận tiền mặt)
 */
export const approveDebtPayment = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = (req as any).user?.userId;
    const { id } = req.params;
    const { notes } = req.body || {};

    if (!staffId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID yêu cầu thanh toán không hợp lệ'
      });
    }

    const session = await mongoose.startSession();
    let result: any;

    try {
      await session.withTransaction(async () => {
        const paymentRequest = await DebtPayment.findById(id)
          .populate('user')
          .session(session);

        if (!paymentRequest) {
          throw new Error('Không tìm thấy yêu cầu thanh toán');
        }

        if (paymentRequest.status !== 'Pending') {
          throw new Error(`Yêu cầu đã được xử lý với trạng thái: ${paymentRequest.status}`);
        }

        const user = await User.findById(paymentRequest.user).session(session);
        if (!user) {
          throw new Error('Không tìm thấy người dùng');
        }

        const currentDebt = user.debt || 0;
        const paymentAmount = Math.min(paymentRequest.amount, currentDebt);

        // Cập nhật nợ của user
        user.debt = Math.max(0, currentDebt - paymentAmount);
        user.debtLastUpdated = new Date();
        
        // Nếu hết nợ, mở khóa quyền mượn sách
        if (user.debt === 0 && !user.canBorrow && user.status === 'Active') {
          user.canBorrow = true;
        }
        
        await user.save({ session });

        // Cập nhật trạng thái yêu cầu thanh toán
        paymentRequest.status = 'Approved';
        paymentRequest.debtAfter = user.debt;
        paymentRequest.processedBy = staffId as any;
        paymentRequest.processedAt = new Date();
        if (notes) {
          paymentRequest.notes = (paymentRequest.notes || '') + '\n[Librarian]: ' + notes;
        }
        await paymentRequest.save({ session });

        result = {
          paymentRequest,
          paidAmount: paymentAmount,
          userDebt: user.debt
        };
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: 'Đã duyệt thanh toán và cập nhật nợ cho người dùng',
      data: result
    });
  } catch (error: any) {
    console.error('Error in approveDebtPayment:', error);
    if (error.message.includes('Không tìm thấy') || error.message.includes('không hợp lệ')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('đã được xử lý')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi duyệt thanh toán'
    });
  }
};

/**
 * POST /api/payments/debt/:id/reject (Librarian/Admin)
 * Từ chối yêu cầu thanh toán nợ
 */
export const rejectDebtPayment = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = (req as any).user?.userId;
    const { id } = req.params;
    const { notes } = req.body || {};

    if (!staffId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID yêu cầu thanh toán không hợp lệ'
      });
    }

    const paymentRequest = await DebtPayment.findById(id);

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu thanh toán'
      });
    }

    if (paymentRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Yêu cầu đã được xử lý với trạng thái: ${paymentRequest.status}`
      });
    }

    paymentRequest.status = 'Rejected';
    paymentRequest.processedBy = staffId as any;
    paymentRequest.processedAt = new Date();
    if (notes) {
      paymentRequest.notes = (paymentRequest.notes || '') + '\n[Librarian]: ' + notes;
    }
    await paymentRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Đã từ chối yêu cầu thanh toán',
      data: { paymentRequest }
    });
  } catch (error: any) {
    console.error('Error in rejectDebtPayment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi từ chối thanh toán'
    });
  }
};

