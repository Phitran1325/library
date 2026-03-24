"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_DEBT_ALLOWED = void 0;
exports.calculateTotalDebt = calculateTotalDebt;
exports.updateUserDebt = updateUserDebt;
exports.createPayOSDebtPayment = createPayOSDebtPayment;
exports.applyExternalDebtPayment = applyExternalDebtPayment;
exports.hasExceededDebtLimit = hasExceededDebtLimit;
exports.getUserDebtInfo = getUserDebtInfo;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const DebtPayment_1 = __importDefault(require("../models/DebtPayment"));
const payosService_1 = require("./payment/payosService");
const MAX_DEBT_ALLOWED = 50000; // 50k VNĐ
exports.MAX_DEBT_ALLOWED = MAX_DEBT_ALLOWED;
/**
 * Tính tổng nợ của user (bao gồm lateFee và damageFee chưa thanh toán)
 */
async function calculateTotalDebt(userId) {
    const user = await User_1.default.findById(userId).select('debt');
    if (!user)
        return 0;
    return user.debt || 0;
}
/**
 * Cập nhật nợ của user khi trả sách
 */
async function updateUserDebt(userId, totalFee) {
    const user = await User_1.default.findById(userId);
    if (!user) {
        throw new Error('Người dùng không tồn tại');
    }
    user.debt = (user.debt || 0) + Math.max(0, totalFee);
    user.totalSpent += totalFee;
    user.debtLastUpdated = new Date();
    await user.save();
}
async function createPayOSDebtPayment(userId, amount, options = {}) {
    if (!amount || typeof amount !== 'number' || Number.isNaN(amount)) {
        throw new Error('Số tiền thanh toán không hợp lệ');
    }
    if (amount <= 0) {
        throw new Error('Số tiền thanh toán phải lớn hơn 0');
    }
    const user = await User_1.default.findById(userId);
    if (!user) {
        throw new Error('Người dùng không tồn tại');
    }
    const currentDebt = user.debt || 0;
    if (currentDebt <= 0) {
        throw new Error('Bạn không có nợ để thanh toán');
    }
    const paymentAmount = Math.min(amount, currentDebt);
    const description = options.description ||
        `Thanh toán phí phạt thư viện - ${paymentAmount.toLocaleString('vi-VN')} VNĐ`;
    const payosResult = await (0, payosService_1.createPayOSPaymentLink)({
        userId,
        type: 'Debt',
        amount: paymentAmount,
        description,
        expiresInMinutes: options.expiresInMinutes ?? 30,
        metadata: {
            context: 'DebtPayment',
            requestedAmount: amount,
            debtBefore: currentDebt,
            ...options.metadata
        }
    });
    return {
        ...payosResult,
        amount: paymentAmount,
        debtBefore: currentDebt,
        debtAfterEstimate: Math.max(0, currentDebt - paymentAmount)
    };
}
async function applyExternalDebtPayment(userId, amount, options = {}) {
    if (!amount || typeof amount !== 'number' || Number.isNaN(amount)) {
        throw new Error('Số tiền thanh toán không hợp lệ');
    }
    if (amount <= 0) {
        throw new Error('Số tiền thanh toán phải lớn hơn 0');
    }
    const session = options.session;
    const shouldManageSession = !session;
    const runInSession = async (activeSession) => {
        const user = await User_1.default.findById(userId).session(activeSession);
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
        await DebtPayment_1.default.create([
            {
                user: user._id,
                amount: paymentAmount,
                method: options.method || 'PayOS',
                debtBefore,
                debtAfter: user.debt,
                metadata: options.metadata
            }
        ], { session: activeSession });
        return {
            paidAmount: paymentAmount,
            remainingDebt: user.debt
        };
    };
    if (shouldManageSession) {
        const managedSession = await mongoose_1.default.startSession();
        let transactionResult = null;
        try {
            await managedSession.withTransaction(async () => {
                transactionResult = await runInSession(managedSession);
            });
        }
        finally {
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
async function hasExceededDebtLimit(userId) {
    const totalDebt = await calculateTotalDebt(userId);
    return totalDebt > MAX_DEBT_ALLOWED;
}
/**
 * Lấy thông tin nợ của user
 */
async function getUserDebtInfo(userId) {
    const user = await User_1.default.findById(userId).select('debt canBorrow status');
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
//# sourceMappingURL=debtService.js.map