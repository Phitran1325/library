"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialSummary = void 0;
const financialReportService_1 = require("../services/financialReportService");
const getFinancialSummary = async (req, res) => {
    try {
        const period = req.query.period || 'all';
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const overview = await (0, financialReportService_1.getFinancialOverview)({
            period,
            startDate,
            endDate
        });
        return res.status(200).json({
            success: true,
            data: overview
        });
    }
    catch (error) {
        console.error('Error getting financial summary:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy báo cáo tài chính'
        });
    }
};
exports.getFinancialSummary = getFinancialSummary;
//# sourceMappingURL=adminFinancialController.js.map