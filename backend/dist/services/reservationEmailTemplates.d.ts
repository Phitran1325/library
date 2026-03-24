/**
 * Email templates cho chức năng đặt sách
 */
export declare const RESERVATION_TEMPLATES: {
    CONFIRMATION: {
        subject: string;
        html: (userName: string, bookTitle: string, queuePosition: number, expiresAt: Date) => string;
    };
    AVAILABLE: {
        subject: string;
        html: (userName: string, bookTitle: string, expiresAt: Date) => string;
    };
    EXPIRING_SOON: {
        subject: string;
        html: (userName: string, bookTitle: string, expiresAt: Date) => string;
    };
    EXPIRED: {
        subject: string;
        html: (userName: string, bookTitle: string) => string;
    };
    NEXT_IN_LINE: {
        subject: string;
        html: (userName: string, bookTitle: string, queuePosition: number, expiresAt: Date) => string;
    };
};
//# sourceMappingURL=reservationEmailTemplates.d.ts.map