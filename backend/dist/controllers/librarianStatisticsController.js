"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityHistory = exports.getPersonalStatistics = void 0;
const librarianStatisticsService_1 = require("../services/librarianStatisticsService");
/**
 * GET /api/librarian/statistics/personal
 * Lấy thống kê cá nhân của thủ thư
 */
const getPersonalStatistics = async (req, res) => {
    try {
        const librarianId = req.user?.userId;
        if (!librarianId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const period = req.query.period || 'all';
        const statistics = await (0, librarianStatisticsService_1.getLibrarianPersonalStatistics)(librarianId, period);
        return res.status(200).json({
            success: true,
            data: statistics
        });
    }
    catch (error) {
        console.error('Error getting librarian personal statistics:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thống kê cá nhân'
        });
    }
};
exports.getPersonalStatistics = getPersonalStatistics;
/**
 * GET /api/librarian/statistics/personal/activity-history
 * Lấy lịch sử hoạt động của thủ thư
 */
const getActivityHistory = async (req, res) => {
    try {
        const librarianId = req.user?.userId;
        if (!librarianId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const activities = await (0, librarianStatisticsService_1.getLibrarianActivityHistory)(librarianId, page, limit);
        return res.status(200).json({
            success: true,
            data: {
                activities,
                pagination: {
                    page,
                    limit,
                    total: activities.length
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting librarian activity history:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy lịch sử hoạt động'
        });
    }
};
exports.getActivityHistory = getActivityHistory;
//# sourceMappingURL=librarianStatisticsController.js.map