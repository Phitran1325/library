"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payosWebhook = void 0;
const Payment_1 = __importDefault(require("../models/Payment"));
const payosService_1 = require("../services/payment/payosService");
const membershipService_1 = require("../services/membershipService");
const debtService_1 = require("../services/debtService");
const payosWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-payos-signature'] || '';
        const payload = req.body;
        const allowMock = process.env.PAYOS_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';
        let isValid = (0, payosService_1.verifyPayOSSignature)(payload, signature);
        // Trong chế độ mock/dev: cho phép bỏ qua chữ ký nếu signature rỗng hoặc là 'mock'/'test'
        if (!isValid && allowMock) {
            if (!signature || signature === 'mock' || signature === 'test') {
                isValid = true;
            }
        }
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }
        const providerRef = payload?.data?.orderCode || payload?.providerRef;
        const status = payload?.data?.status || payload?.status;
        const payment = await Payment_1.default.findOne({ provider: 'PayOS', providerRef });
        if (!payment) {
            return res.status(200).json({ success: true }); // ignore unknown
        }
        if (payment.status === 'Succeeded' || payment.status === 'Failed' || payment.status === 'Canceled') {
            return res.status(200).json({ success: true }); // idempotent
        }
        if (status === 'PAID' || status === 'SUCCEEDED' || status === 'SUCCESS') {
            payment.status = 'Succeeded';
            await payment.save();
            if (payment.type === 'Membership' && payment.plan) {
                // decide action: if user has active -> switch, else subscribe/renew after expiry
                const active = await (0, membershipService_1.getActiveSubscription)(String(payment.user));
                if (active) {
                    await (0, membershipService_1.createOrSwitchSubscription)(String(payment.user), String(payment.plan), {
                        previousSubscriptionId: active._id,
                        source: 'Payment'
                    });
                }
                else {
                    await (0, membershipService_1.renewAfterExpired)(String(payment.user), String(payment.plan), { source: 'Payment' });
                }
            }
            else if (payment.type === 'Debt') {
                await (0, debtService_1.applyExternalDebtPayment)(String(payment.user), payment.amount, {
                    method: 'PayOS',
                    metadata: {
                        providerRef,
                        paymentId: payment._id,
                        source: 'PayOSWebhook'
                    }
                });
            }
        }
        else if (status === 'CANCELED') {
            payment.status = 'Canceled';
            await payment.save();
        }
        else if (status === 'FAILED') {
            payment.status = 'Failed';
            await payment.save();
        }
        return res.status(200).json({ success: true });
    }
    catch (err) {
        console.error('payosWebhook error', err);
        return res.status(500).json({ success: false });
    }
};
exports.payosWebhook = payosWebhook;
//# sourceMappingURL=paymentController.js.map