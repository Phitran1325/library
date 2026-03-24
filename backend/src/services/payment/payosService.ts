import crypto from 'crypto';
import axios from 'axios';
import Payment from '../../models/Payment';

export interface CreatePayOSPaymentParams {
  userId: string;
  type: 'Membership' | 'Rental' | 'Debt';
  planId?: string;
  bookId?: string;
  rentalDays?: number;
  amount: number;
  description: string;
  expiresInMinutes?: number;
  metadata?: Record<string, any>;
}

export interface CreatePayOSPaymentResult {
  paymentId?: string; // _id của Payment record
  providerRef: string;
  checkoutUrl: string;
  expiresAt: Date;
  qrCode?: string;
  qrCodeUrl?: string;
  qrCodeBase64?: string;
}

// Minimal PayOS integration placeholder.
// In real integration, call PayOS API to create a payment link.
export async function createPayOSPaymentLink(params: CreatePayOSPaymentParams): Promise<CreatePayOSPaymentResult> {
  const {
    userId, type, planId, bookId, rentalDays, amount, description, expiresInMinutes = 30, metadata = {}
  } = params;

  const clientId = process.env.PAYOS_CLIENT_ID || '';
  const apiKey = process.env.PAYOS_API_KEY || '';
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';
  const baseUrl = process.env.PAYOS_BASE_URL || 'https://api.payos.vn';
  const returnUrl = process.env.PAYOS_RETURN_URL || 'http://localhost:3000/payment/success';
  const cancelUrl = process.env.PAYOS_CANCEL_URL || 'http://localhost:3000/payment/cancel';
  const enableMockMode = process.env.PAYOS_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';

  const orderCode = Number(String(Date.now()).slice(-9));
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Nếu không có config hoặc enable mock mode, dùng mock payment link
  if (!clientId || !apiKey || enableMockMode) {
    console.log('⚠️  PayOS Mock Mode: Creating mock payment link (for development/testing)');
    const providerRef = String(orderCode);
    const mockCheckoutUrl = `${returnUrl}?orderCode=${orderCode}&mock=true`;

    const mockQrPayload = {
      qrCode: mockCheckoutUrl,
      qrCodeUrl: mockCheckoutUrl,
      qrCodeBase64: undefined
    };

    const payment = await Payment.create({
      user: userId,
      type,
      plan: type === 'Membership' ? planId : undefined,
      book: type === 'Rental' ? (bookId as any) : undefined,
      rentalDays: type === 'Rental' ? rentalDays : undefined,
      amount,
      currency: 'VND',
      provider: 'PayOS',
      providerRef,
      checkoutUrl: mockCheckoutUrl,
      status: 'Pending',
      expiresAt,
      metadata: { description, mockMode: true, ...metadata, ...mockQrPayload }
    });

    return { 
      paymentId: (payment._id as any).toString(),
      providerRef, 
      checkoutUrl: mockCheckoutUrl, 
      expiresAt, 
      ...mockQrPayload 
    };
  }

  // Thử gọi PayOS API thật
  try {
    // Payload theo tài liệu PayOS (có thể khác tùy phiên bản). Giữ linh hoạt và thêm metadata.
    const body: any = {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
      expiredAt: Math.floor(expiresAt.getTime() / 1000),
      metadata: { userId, type, planId, bookId, rentalDays, ...metadata }
    };

    // Một số phiên bản yêu cầu chữ ký checksum. Nếu có key, ký SHA256(body + key).
    if (checksumKey) {
      const raw = JSON.stringify(body);
      body.signature = crypto.createHmac('sha256', checksumKey).update(raw).digest('hex');
    }

    const url = `${baseUrl.replace(/\/$/, '')}/v2/payment-requests`;
    const resp = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey
      },
      timeout: 15000
    });
    // @ts-ignore
    const data = resp.data?.data || resp.data; // linh hoạt theo response schema
    const providerRef = String(data?.orderCode || orderCode);
    const checkoutUrl = data?.checkoutUrl || data?.paymentLink || data?.checkoutUrlEmbedded || '';
    const qrPayload = {
      qrCode: data?.qrCode || data?.qrCodeData || data?.qr || data?.qrContent,
      qrCodeUrl: data?.qrCodeUrl || data?.qrCodeImage,
      qrCodeBase64: data?.qrCodeBase64
    };

    if (!checkoutUrl) {
      throw new Error('PAYOS_NO_CHECKOUT_URL');
    }

    const payment = await Payment.create({
      user: userId,
      type,
      plan: type === 'Membership' ? planId : undefined,
      book: type === 'Rental' ? (bookId as any) : undefined,
      rentalDays: type === 'Rental' ? rentalDays : undefined,
      amount,
      currency: 'VND',
      provider: 'PayOS',
      providerRef,
      checkoutUrl,
      status: 'Pending',
      expiresAt,
      metadata: { description, ...metadata, ...qrPayload }
    });

    return { 
      paymentId: (payment._id as any).toString(),
      providerRef, 
      checkoutUrl, 
      expiresAt, 
      ...qrPayload 
    };
  } catch (error: any) {
    // Nếu lỗi kết nối (ENOTFOUND, ECONNREFUSED, timeout), fallback sang mock mode
    const isConnectionError = 
      error.code === 'ENOTFOUND' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('getaddrinfo') ||
      error.message?.includes('timeout');

    if (isConnectionError || process.env.NODE_ENV === 'development') {
      console.log('⚠️  PayOS connection failed, using mock mode:', error.message || error.code);
      const providerRef = String(orderCode);
      const mockCheckoutUrl = `${returnUrl}?orderCode=${orderCode}&mock=true`;

      const mockQrPayload = {
        qrCode: mockCheckoutUrl,
        qrCodeUrl: mockCheckoutUrl,
        qrCodeBase64: undefined
      };

      const payment = await Payment.create({
        user: userId,
        type,
        plan: type === 'Membership' ? planId : undefined,
        book: type === 'Rental' ? (bookId as any) : undefined,
        rentalDays: type === 'Rental' ? rentalDays : undefined,
        amount,
        currency: 'VND',
        provider: 'PayOS',
        providerRef,
        checkoutUrl: mockCheckoutUrl,
        status: 'Pending',
        expiresAt,
        metadata: { description, mockMode: true, error: error.message || error.code, ...metadata, ...mockQrPayload }
      });

      return { 
        paymentId: (payment._id as any).toString(),
        providerRef, 
        checkoutUrl: mockCheckoutUrl, 
        expiresAt, 
        ...mockQrPayload 
      };
    }

    // Nếu là lỗi khác (validation, auth...), throw lên
    throw error;
  }
}

export function verifyPayOSSignature(payload: any, signature: string): boolean {
  const secret = process.env.PAYOS_WEBHOOK_SECRET || process.env.PAYOS_CHECKSUM_KEY || '';
  if (!secret) return true; // dev fallback

  // Cố gắng 2 cách: ký toàn bộ payload hoặc ký payload.data
  const rawFull = JSON.stringify(payload);
  const sigFull = crypto.createHmac('sha256', secret).update(rawFull).digest('hex');
  if (sigFull === signature) return true;

  if (payload?.data) {
    const rawData = JSON.stringify(payload.data);
    const sigData = crypto.createHmac('sha256', secret).update(rawData).digest('hex');
    if (sigData === signature) return true;
  }
  return false;
}


