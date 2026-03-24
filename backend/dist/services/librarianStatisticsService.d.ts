import mongoose from 'mongoose';
export interface TimePeriod {
    startDate: Date;
    endDate: Date;
}
export interface LibrarianStatistics {
    overview: {
        totalBooksCreated: number;
        totalBookCopiesCreated: number;
        totalBooksMarkedLost: number;
        totalBooksMarkedDamaged: number;
        totalReservationsRejected: number;
        totalViolationsRecorded: number;
        totalLateFeesRecorded: number;
        totalDamageFeesRecorded: number;
    };
    books: {
        totalCreated: number;
        byCategory: {
            [category: string]: number;
        };
        newReleases: number;
        createdInPeriod: number;
    };
    bookCopies: {
        totalCreated: number;
        byStatus: {
            [status: string]: number;
        };
        byCondition: {
            [condition: string]: number;
        };
        createdInPeriod: number;
    };
    borrows: {
        total: number;
        byStatus: {
            [status: string]: number;
        };
        byType: {
            [type: string]: number;
        };
        overdue: number;
        totalLateFees: number;
        totalDamageFees: number;
    };
    reservations: {
        total: number;
        byStatus: {
            [status: string]: number;
        };
        rejected: number;
    };
    violations: {
        total: number;
        byType: {
            [type: string]: number;
        };
        bySeverity: {
            [severity: string]: number;
        };
    };
    timeline: {
        today: Partial<LibrarianStatistics['overview']>;
        thisWeek: Partial<LibrarianStatistics['overview']>;
        thisMonth: Partial<LibrarianStatistics['overview']>;
    };
}
/**
 * Lấy thống kê cá nhân cho thủ thư
 */
export declare function getLibrarianPersonalStatistics(librarianId: string, period?: 'today' | 'week' | 'month' | 'year' | 'all'): Promise<LibrarianStatistics>;
/**
 * Lấy lịch sử hoạt động của thủ thư
 */
export declare function getLibrarianActivityHistory(librarianId: string, page?: number, limit?: number): Promise<({
    type: string;
    action: string;
    borrow: {
        id: mongoose.Types.ObjectId;
        book: mongoose.Types.ObjectId;
        user: mongoose.Types.ObjectId;
        lateFee: number;
        damageFee: number;
    };
    createdAt: any;
} | {
    type: string;
    action: string;
    reservation: {
        id: mongoose.Types.ObjectId;
        book: mongoose.Types.ObjectId;
        user: mongoose.Types.ObjectId;
        reason: string | undefined;
    };
    createdAt: any;
})[]>;
//# sourceMappingURL=librarianStatisticsService.d.ts.map