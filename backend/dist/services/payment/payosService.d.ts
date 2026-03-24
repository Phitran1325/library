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
    paymentId?: string;
    providerRef: string;
    checkoutUrl: string;
    expiresAt: Date;
    qrCode?: string;
    qrCodeUrl?: string;
    qrCodeBase64?: string;
}
export declare function createPayOSPaymentLink(params: CreatePayOSPaymentParams): Promise<CreatePayOSPaymentResult>;
export declare function verifyPayOSSignature(payload: any, signature: string): boolean;
//# sourceMappingURL=payosService.d.ts.map