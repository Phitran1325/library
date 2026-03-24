"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRemindersController = exports.processRemindersController = exports.getReminderStats = exports.sendManualReminderController = exports.getReminders = void 0;
const BorrowReminder_1 = __importDefault(require("../models/BorrowReminder"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
const reminderService_1 = require("../services/reminderService");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * GET /api/reminders
 * Lấy danh sách reminders (cho user hoặc admin/librarian)
 */
const getReminders = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { page = 1, limit = 20, status, type, borrowId } = req.query;
        // Validation
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số trang phải là số nguyên dương'
            });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng mỗi trang phải từ 1 đến 100'
            });
        }
        // Build query
        const query = {};
        // Reader chỉ xem reminders của mình
        if (userRole === 'Reader') {
            query.user = userId;
        }
        // Admin và Librarian có thể xem tất cả hoặc filter theo user
        else if (userRole === 'Admin' || userRole === 'Librarian') {
            const { userId: filterUserId } = req.query;
            if (filterUserId) {
                if (!mongoose_1.default.Types.ObjectId.isValid(filterUserId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'ID người dùng không hợp lệ'
                    });
                }
                query.user = filterUserId;
            }
        }
        else {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }
        // Filter theo status
        if (status) {
            const validStatuses = ['PENDING', 'SENT', 'FAILED'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${validStatuses.join(', ')}`
                });
            }
            query.status = status;
        }
        // Filter theo type
        if (type) {
            const validTypes = ['BEFORE_DUE', 'OVERDUE', 'MANUAL'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: `Loại nhắc nhở không hợp lệ. Giá trị hợp lệ: ${validTypes.join(', ')}`
                });
            }
            query.type = type;
        }
        // Filter theo borrowId
        if (borrowId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(borrowId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID phiếu mượn không hợp lệ'
                });
            }
            query.borrow = borrowId;
        }
        const skip = (pageNum - 1) * limitNum;
        const [reminders, total] = await Promise.all([
            BorrowReminder_1.default.find(query)
                .populate('borrow', 'borrowDate dueDate status')
                .populate('user', 'fullName email')
                .populate({
                path: 'borrow',
                populate: {
                    path: 'book',
                    select: 'title coverImage isbn'
                }
            })
                .sort({ scheduledDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            BorrowReminder_1.default.countDocuments(query)
        ]);
        return res.status(200).json({
            success: true,
            data: {
                reminders,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting reminders:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách nhắc nhở'
        });
    }
};
exports.getReminders = getReminders;
/**
 * POST /api/reminders/manual/:borrowId
 * Gửi nhắc nhở thủ công (chỉ Admin/Librarian)
 */
const sendManualReminderController = async (req, res) => {
    try {
        const userRole = req.user?.role;
        const { borrowId } = req.params;
        const { customMessage } = req.body;
        // Kiểm tra quyền
        if (userRole !== 'Admin' && userRole !== 'Librarian') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Admin và Librarian mới có quyền gửi nhắc nhở thủ công'
            });
        }
        // Validation
        if (!borrowId) {
            return res.status(400).json({
                success: false,
                message: 'ID phiếu mượn là bắt buộc'
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(borrowId)) {
            return res.status(400).json({
                success: false,
                message: 'ID phiếu mượn không hợp lệ'
            });
        }
        // Kiểm tra customMessage nếu có
        if (customMessage !== undefined) {
            if (typeof customMessage !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Tin nhắn tùy chỉnh phải là chuỗi ký tự'
                });
            }
            if (customMessage.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'Tin nhắn tùy chỉnh không được vượt quá 500 ký tự'
                });
            }
        }
        // Kiểm tra borrow có tồn tại không
        const borrow = await Borrow_1.default.findById(borrowId);
        if (!borrow) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu mượn'
            });
        }
        // Kiểm tra borrow chưa trả
        if (borrow.status === 'Returned') {
            return res.status(400).json({
                success: false,
                message: 'Không thể gửi nhắc nhở cho sách đã được trả'
            });
        }
        // Gửi reminder
        const result = await (0, reminderService_1.sendManualReminder)(borrowId, customMessage);
        return res.status(200).json({
            success: true,
            message: 'Đã gửi nhắc nhở thành công',
            data: result
        });
    }
    catch (error) {
        console.error('Error sending manual reminder:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi gửi nhắc nhở'
        });
    }
};
exports.sendManualReminderController = sendManualReminderController;
/**
 * GET /api/reminders/stats
 * Lấy thống kê reminders (chỉ Admin/Librarian)
 */
const getReminderStats = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'Admin' && userRole !== 'Librarian') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Admin và Librarian mới có quyền xem thống kê'
            });
        }
        const { startDate, endDate } = req.query;
        const query = {};
        // Filter theo ngày nếu có
        if (startDate || endDate) {
            query.scheduledDate = {};
            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ngày bắt đầu không hợp lệ'
                    });
                }
                query.scheduledDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ngày kết thúc không hợp lệ'
                    });
                }
                end.setHours(23, 59, 59, 999);
                query.scheduledDate.$lte = end;
            }
        }
        const [totalReminders, pendingReminders, sentReminders, failedReminders, byType, byStatus] = await Promise.all([
            BorrowReminder_1.default.countDocuments(query),
            BorrowReminder_1.default.countDocuments({ ...query, status: 'PENDING' }),
            BorrowReminder_1.default.countDocuments({ ...query, status: 'SENT' }),
            BorrowReminder_1.default.countDocuments({ ...query, status: 'FAILED' }),
            BorrowReminder_1.default.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                }
            ]),
            BorrowReminder_1.default.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        return res.status(200).json({
            success: true,
            data: {
                total: totalReminders,
                pending: pendingReminders,
                sent: sentReminders,
                failed: failedReminders,
                byType: byType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byStatus: byStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    }
    catch (error) {
        console.error('Error getting reminder stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê nhắc nhở'
        });
    }
};
exports.getReminderStats = getReminderStats;
/**
 * POST /api/reminders/process
 * Xử lý reminders đang chờ (chỉ Admin - để test hoặc trigger thủ công)
 */
const processRemindersController = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Admin mới có quyền trigger xử lý reminders'
            });
        }
        const result = await (0, reminderService_1.processPendingReminders)();
        return res.status(200).json({
            success: true,
            message: 'Đã xử lý reminders',
            data: result
        });
    }
    catch (error) {
        console.error('Error processing reminders:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xử lý reminders'
        });
    }
};
exports.processRemindersController = processRemindersController;
/**
 * POST /api/reminders/schedule
 * Tạo lịch reminders mới (chỉ Admin - để test hoặc trigger thủ công)
 */
const scheduleRemindersController = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Admin mới có quyền trigger tạo lịch reminders'
            });
        }
        const [beforeDueCount, overdueCount] = await Promise.all([
            (0, reminderService_1.scheduleBeforeDueReminders)(),
            (0, reminderService_1.scheduleOverdueReminders)()
        ]);
        return res.status(200).json({
            success: true,
            message: 'Đã tạo lịch reminders',
            data: {
                beforeDue: beforeDueCount,
                overdue: overdueCount,
                total: beforeDueCount + overdueCount
            }
        });
    }
    catch (error) {
        console.error('Error scheduling reminders:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo lịch reminders'
        });
    }
};
exports.scheduleRemindersController = scheduleRemindersController;
//# sourceMappingURL=reminderController.js.map