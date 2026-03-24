"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReport = exports.getReportDetail = exports.listReports = exports.getMyReports = exports.submitReport = void 0;
const ebookContentReportService_1 = require("../services/ebookContentReportService");
const ensureAuthUser = (req) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new Error('Unauthorized');
    }
    return userId;
};
const submitReport = async (req, res) => {
    try {
        const reporterId = ensureAuthUser(req);
        const { bookId, digitalFileId, issueType, description, pageNumber, evidenceUrls } = req.body;
        const report = await (0, ebookContentReportService_1.submitEbookContentReport)({
            reporterId,
            bookId,
            digitalFileId,
            issueType,
            description,
            pageNumber,
            evidenceUrls,
        });
        return res.status(201).json({
            success: true,
            message: 'Đã gửi báo cáo nội dung',
            data: report,
        });
    }
    catch (error) {
        const status = error?.message === 'Unauthorized' ? 401 : 400;
        return res.status(status).json({
            success: false,
            message: error?.message || 'Không thể gửi báo cáo nội dung ebook',
        });
    }
};
exports.submitReport = submitReport;
const getMyReports = async (req, res) => {
    try {
        const reporterId = ensureAuthUser(req);
        const { page = '1', limit = '10', status } = req.query;
        const data = await (0, ebookContentReportService_1.listMyContentReports)(reporterId, {
            page: Number(page),
            limit: Number(limit),
            status: status,
        });
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        const status = error?.message === 'Unauthorized' ? 401 : 400;
        return res.status(status).json({
            success: false,
            message: error?.message || 'Không thể lấy danh sách báo cáo của bạn',
        });
    }
};
exports.getMyReports = getMyReports;
const listReports = async (req, res) => {
    try {
        const { page = '1', limit = '20', status, issueType, bookId, reporterId, search } = req.query;
        const data = await (0, ebookContentReportService_1.listEbookContentReports)({
            page: Number(page),
            limit: Number(limit),
            status: status,
            issueType: issueType,
            bookId,
            reporterId,
            search,
        });
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error?.message || 'Không thể lấy danh sách báo cáo',
        });
    }
};
exports.listReports = listReports;
const getReportDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await (0, ebookContentReportService_1.getEbookContentReportById)(id);
        return res.status(200).json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error?.message || 'Không thể lấy chi tiết báo cáo',
        });
    }
};
exports.getReportDetail = getReportDetail;
const updateReport = async (req, res) => {
    try {
        const handledBy = ensureAuthUser(req);
        const { id } = req.params;
        const { status, resolutionNotes } = req.body;
        const report = await (0, ebookContentReportService_1.updateEbookContentReport)({
            id,
            handledBy,
            status,
            resolutionNotes,
        });
        return res.status(200).json({
            success: true,
            message: 'Đã cập nhật báo cáo',
            data: report,
        });
    }
    catch (error) {
        const status = error?.message === 'Unauthorized' ? 401 : 400;
        return res.status(status).json({
            success: false,
            message: error?.message || 'Không thể cập nhật báo cáo',
        });
    }
};
exports.updateReport = updateReport;
//# sourceMappingURL=ebookContentReportController.js.map