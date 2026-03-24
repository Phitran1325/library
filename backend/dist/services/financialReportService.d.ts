export type FinancialPeriod = 'today' | 'week' | 'month' | 'year' | 'all';
export interface FinancialOverviewOptions {
    period?: FinancialPeriod;
    startDate?: string;
    endDate?: string;
}
export interface FinancialOverview {
    period: FinancialPeriod;
    range: {
        startDate?: Date;
        endDate: Date;
    };
    revenue: {
        totalAmount: number;
        totalCount: number;
        byType: Record<string, {
            amount: number;
            count: number;
        }>;
        statusBreakdown: Record<string, number>;
        timeline: Array<{
            date: string;
            amount: number;
            count: number;
        }>;
    };
    debt: {
        outstanding: {
            total: number;
            average: number;
            debtorCount: number;
            overLimitCount: number;
            max: number;
        };
        repayments: {
            total: number;
            count: number;
            byMethod: Record<string, number>;
        };
    };
    fines: {
        totalLateFee: number;
        totalDamageFee: number;
        totalBorrowWithFees: number;
        overdueBorrows: number;
    };
    users: {
        totalSpent: number;
        averageSpent: number;
        maxSpent: number;
        minSpent: number;
        topSpenders: Array<{
            userId: string;
            fullName: string;
            email: string;
            totalSpent: number;
        }>;
    };
}
export declare function getFinancialOverview(options?: FinancialOverviewOptions): Promise<FinancialOverview>;
//# sourceMappingURL=financialReportService.d.ts.map