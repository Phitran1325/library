import mongoose, { ClientSession } from 'mongoose';
import User from '../models/User';
import DebtPayment, { DebtPaymentMethod } from '../models/DebtPayment';

const MAX_DEBT_ALLOWED = 50000; // 50k VNĐ

/**
 * Tính tổng nợ của user (bao gồm lateFee và damageFee chưa thanh toán)
 */
export async function calculateTotalDebt(userId: string): Promise<number> {
  const user = await User.findById(userId).select('debt');
  if (!user) return 0;
  return user.debt || 0;
}

/**
 * Cập nhật nợ của user khi trả sách
 */
export async function updateUserDebt(
  userId: string,
  totalFee: number
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  user.debt = (user.debt || 0) + Math.max(0, totalFee);
  user.totalSpent += totalFee;
  user.debtLastUpdated = new Date();
  await user.save();
}

interface PayDebtOptions {
  session?: ClientSession;
  method?: DebtPaymentMethod;
  metadata?: Record<string, any>;
}

/**
 * Tạo yêu cầu thanh toán nợ thủ công (User request, Librarian approve)
 */
export async function createManualDebtPaymentRequest(
  userId: string,
  amount: number,
  notes?: string
): Promise<{
  paymentRequest: any;
  debtBefore: number;
  debtAfterEstimate: number;
}> {
  if (!amount || typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new Error('Số tiền thanh toán không hợp lệ');
  }

  if (amount <= 0) {
    throw new Error('Số tiền thanh toán phải lớn hơn 0');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  const currentDebt = user.debt || 0;
  if (currentDebt <= 0) {
    throw new Error('Bạn không có nợ để thanh toán');
  }

  const paymentAmount = Math.min(amount, currentDebt);
  const debtAfterEstimate = Math.max(0, currentDebt - paymentAmount);

  // Tạo yêu cầu thanh toán với status Pending
  const paymentRequest = await DebtPayment.create({
    user: userId,
    amount: paymentAmount,
    method: 'Manual',
    status: 'Pending',
    debtBefore: currentDebt,
    debtAfter: debtAfterEstimate,
    notes: notes || 'Yêu cầu thanh toán phí bồi thường',
    metadata: {
      requestedAt: new Date(),
      source: 'UserSelfService'
    }
  });

  return {
    paymentRequest,
    debtBefore: currentDebt,
    debtAfterEstimate
  };
}

export async function applyExternalDebtPayment(
  userId: string,
  amount: number,
  options: PayDebtOptions = {}
): Promise<{
  paidAmount: number;
  remainingDebt: number;
}> {
  if (!amount || typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new Error('Số tiền thanh toán không hợp lệ');
  }

  if (amount <= 0) {
    throw new Error('Số tiền thanh toán phải lớn hơn 0');
  }

  const session = options.session;
  const shouldManageSession = !session;
  const runInSession = async (activeSession: ClientSession) => {
    const user = await User.findById(userId).session(activeSession);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const currentDebt = user.debt || 0;
    if (currentDebt <= 0) {
      return {
        paidAmount: 0,
        remainingDebt: currentDebt
      };
    }

    const paymentAmount = Math.min(amount, currentDebt);
    if (paymentAmount <= 0) {
      return {
        paidAmount: 0,
        remainingDebt: currentDebt
      };
    }

    const debtBefore = currentDebt;

    user.debt = Math.max(0, currentDebt - paymentAmount);
    user.debtLastUpdated = new Date();
    await user.save({ session: activeSession });

    await DebtPayment.create(
      [
        {
          user: user._id,
          amount: paymentAmount,
          method: options.method || 'PayOS',
          debtBefore,
          debtAfter: user.debt,
          metadata: options.metadata
        }
      ],
      { session: activeSession }
    );

    return {
      paidAmount: paymentAmount,
      remainingDebt: user.debt
    };
  };

  if (shouldManageSession) {
    const managedSession = await mongoose.startSession();
    let transactionResult: {
      paidAmount: number;
      remainingDebt: number;
    } | null = null;

    try {
      await managedSession.withTransaction(async () => {
        transactionResult = await runInSession(managedSession);
      });
    } finally {
      await managedSession.endSession();
    }

    if (!transactionResult) {
      throw new Error('Thanh toán không thành công, vui lòng thử lại');
    }

    return transactionResult;
  }

  return runInSession(session);
}

/**
 * Kiểm tra user có nợ quá giới hạn không
 */
export async function hasExceededDebtLimit(userId: string): Promise<boolean> {
  const totalDebt = await calculateTotalDebt(userId);
  return totalDebt > MAX_DEBT_ALLOWED;
}

/**
 * Lấy thông tin nợ của user
 */
export async function getUserDebtInfo(userId: string): Promise<{
  totalDebt: number;
  canBorrow: boolean;
  exceededLimit: boolean;
}> {
  const user = await User.findById(userId).select('debt canBorrow status');
  if (!user) {
    return {
      totalDebt: 0,
      canBorrow: false,
      exceededLimit: false
    };
  }

  const totalDebt = user.debt || 0;
  const exceededLimit = totalDebt > MAX_DEBT_ALLOWED;

  return {
    totalDebt,
    canBorrow: !exceededLimit && user.canBorrow && user.status === 'Active',
    exceededLimit
  };
}

export { MAX_DEBT_ALLOWED };


