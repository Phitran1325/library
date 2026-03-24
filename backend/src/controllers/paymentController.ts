import { Request, Response } from 'express';
import Payment from '../models/Payment';
import { verifyPayOSSignature } from '../services/payment/payosService';
import { createOrSwitchSubscription, renewAfterExpired, getActiveSubscription } from '../services/membershipService';
import { applyExternalDebtPayment } from '../services/debtService';

export const payosWebhook = async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-payos-signature'] as string) || '';
    const payload = req.body;
    const allowMock = process.env.PAYOS_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';

    let isValid = verifyPayOSSignature(payload, signature);
    // Trong chế độ mock/dev: cho phép bỏ qua chữ ký nếu signature rỗng hoặc là 'mock'/'test'
    if (!isValid && allowMock) {
      if (!signature || signature === 'mock' || signature === 'test') {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const providerRef: string = payload?.data?.orderCode || payload?.providerRef;
    const status: string = payload?.data?.status || payload?.status;
    const payment = await Payment.findOne({ provider: 'PayOS', providerRef });
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
        const active = await getActiveSubscription(String(payment.user));
        if (active) {
          await createOrSwitchSubscription(String(payment.user), String(payment.plan), {
            previousSubscriptionId: (active as any)._id,
            source: 'Payment'
          });
        } else {
          await renewAfterExpired(String(payment.user), String(payment.plan), { source: 'Payment' });
        }
      } else if (payment.type === 'Debt') {
        await applyExternalDebtPayment(String(payment.user), payment.amount, {
          method: 'PayOS',
          metadata: {
            providerRef,
            paymentId: payment._id,
            source: 'PayOSWebhook'
          }
        });
      }
    } else if (status === 'CANCELED') {
      payment.status = 'Canceled';
      await payment.save();
    } else if (status === 'FAILED') {
      payment.status = 'Failed';
      await payment.save();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('payosWebhook error', err);
    return res.status(500).json({ success: false });
  }
};


