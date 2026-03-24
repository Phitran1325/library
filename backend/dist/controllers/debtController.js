"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmDebtPayment = exports.getDebtHistory = exports.payDebt = exports.getDebtInfo = void 0;
const debtService_1 = require("../services/debtService");
const DebtPayment_1 = __importDefault(require("../models/DebtPayment"));
const Payment_1 = __importDefault(require("../models/Payment"));
/**
 * GET /api/payments/debt/info
 * Lấy thông tin nợ của user hiện tại
 */
const getDebtInfo = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const debtInfo = await (0, debtService_1.getUserDebtInfo)(userId);
        return res.status(200).json({
            success: true,
            data: debtInfo
        });
    }
    catch (error) {
        console.error('Error in getDebtInfo:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thông tin nợ'
        });
    }
};
exports.getDebtInfo = getDebtInfo;
/**
 * POST /api/payments/debt/pay
 * Thanh toán nợ phí phạt
 */
const payDebt = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { amount } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const parsedAmount = typeof amount === 'string' ? Number(amount) : amount;
        if (!parsedAmount || typeof parsedAmount !== 'number' || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền thanh toán không hợp lệ'
            });
        }
        const paymentRequest = await (0, debtService_1.createPayOSDebtPayment)(userId, parsedAmount, {
            metadata: {
                source: 'UserSelfService'
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Khởi tạo thanh toán phí phạt qua PayOS thành công',
            data: {
                orderCode: paymentRequest.providerRef,
                checkoutUrl: paymentRequest.checkoutUrl,
                expiresAt: paymentRequest.expiresAt,
                qrCode: paymentRequest.qrCode,
                qrCodeUrl: paymentRequest.qrCodeUrl,
                qrCodeBase64: paymentRequest.qrCodeBase64,
                amount: paymentRequest.amount,
                debtPreview: {
                    before: paymentRequest.debtBefore,
                    after: paymentRequest.debtAfterEstimate
                },
                debtInfo: await (0, debtService_1.getUserDebtInfo)(userId)
            }
        });
    }
    catch (error) {
        console.error('Error in payDebt:', error);
        if (error.message &&
            (error.message.includes('không có nợ') ||
                error.message.includes('không hợp lệ') ||
                error.message.includes('Người dùng không tồn tại'))) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi thanh toán nợ'
        });
    }
};
exports.payDebt = payDebt;
/**
 * GET /api/payments/debt/history
 * Lịch sử thanh toán nợ của user
 */
const getDebtHistory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;
        const [history, total] = await Promise.all([
            DebtPayment_1.default.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            DebtPayment_1.default.countDocuments({ user: userId })
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
    }
    catch (error) {
        console.error('Error in getDebtHistory:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy lịch sử thanh toán'
        });
    }
};
exports.getDebtHistory = getDebtHistory;
/**
 * POST /api/payments/debt/confirm
 * Xác nhận thanh toán phí bồi thường (dùng khi webhook không tới)
 */
const confirmDebtPayment = async (req, res) => {
    try {
        const userId = req.user?.userId;
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
        const payment = await Payment_1.default.findOne({
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
            paymentResult = await (0, debtService_1.applyExternalDebtPayment)(userId, payment.amount, {
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
                debtInfo: await (0, debtService_1.getUserDebtInfo)(userId)
            }
        });
    }
    catch (error) {
        console.error('Error in confirmDebtPayment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xác nhận thanh toán nợ'
        });
    }
};
exports.confirmDebtPayment = confirmDebtPayment;
//# sourceMappingURL=debtController.js.map