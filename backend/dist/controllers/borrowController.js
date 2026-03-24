"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectBorrowRequest = exports.approveBorrowRequest = exports.markBookAsDamaged = exports.sendBatchReminders = exports.markBookAsLost = exports.sendReminderForBorrow = exports.calculateLateFees = exports.listMyBorrowHistory = exports.getAllBorrows = exports.renewBorrowedBook = exports.returnBorrowedBook = exports.requestReturn = exports.getBorrowById = exports.createRentalPayment = exports.getMyBorrowingInfo = exports.getMyBorrows = exports.borrowBook = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
const Book_1 = __importDefault(require("../models/Book"));
const User_1 = __importDefault(require("../models/User"));
const borrowService_1 = require("../services/borrowService");
const emailService_1 = require("../services/emailService");
const violationService_1 = require("../services/violationService");
const borrowingConstants_1 = require("../utils/borrowingConstants");
/**
 * POST /api/borrows
 * Tạo yêu cầu mượn sách (Pending status)
 */
const borrowBook = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { bookId, borrowType = 'Membership', rentalDays } = req.body;
        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ID sách'
            });
        }
        // Kiểm tra sách có tồn tại và còn trong kho không
        const book = await Book_1.default.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách'
            });
        }
        if (book.available <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Sách hiện không còn trong kho'
            });
        }
        // Kiểm tra user có đang có yêu cầu pending cho sách này không
        const existingPending = await Borrow_1.default.findOne({
            user: userId,
            book: bookId,
            status: 'Pending'
        });
        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã có yêu cầu mượn sách này đang chờ xử lý'
            });
        }
        // Tạo borrow request với status Pending
        const borrow = new Borrow_1.default({
            user: userId,
            book: bookId,
            borrowType,
            rentalDays: rentalDays || undefined,
            status: 'Pending',
            renewalCount: 0,
            maxRenewals: 1, // Default, sẽ được cập nhật khi approve
            lateFee: 0,
            damageFee: 0
        });
        await borrow.save();
        // Populate để trả về thông tin đầy đủ
        await borrow.populate('book', 'title coverImage isbn');
        await borrow.populate('user', 'fullName email');
        return res.status(201).json({
            success: true,
            message: 'Yêu cầu mượn sách đã được gửi, vui lòng chờ thủ thư xác nhận',
            data: {
                borrow: {
                    id: borrow._id,
                    book: borrow.book,
                    user: borrow.user,
                    borrowType: borrow.borrowType,
                    status: borrow.status,
                    rentalDays: borrow.rentalDays,
                    createdAt: borrow.createdAt
                }
            }
        });
    }
    catch (error) {
        console.error('Error in borrowBook:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo yêu cầu mượn sách'
        });
    }
};
exports.borrowBook = borrowBook;
/**
 * GET /api/borrows/me
 * Lấy danh sách sách đang mượn của user hiện tại
 */
const getMyBorrows = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let query = { user: userId };
        if (status)
            query.status = status;
        const borrows = await Borrow_1.default.find(query)
            .populate('book', 'title coverImage isbn authorId category')
            .populate('user', 'fullName email')
            .sort({ borrowDate: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Borrow_1.default.countDocuments(query);
        const borrowsWithDetails = borrows.map((borrow) => {
            const borrowObj = borrow.toObject();
            let daysLate = 0;
            if (borrow.status === 'Borrowed' || borrow.status === 'Overdue') {
                if (borrow.dueDate < new Date()) {
                    daysLate = Math.floor((Date.now() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));
                }
            }
            else if (borrow.status === 'Returned' && borrow.returnDate) {
                daysLate = Math.floor((borrow.returnDate.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            }
            return {
                ...borrowObj,
                daysLate: Math.max(0, daysLate)
            };
        });
        return res.status(200).json({
            success: true,
            data: {
                borrows: borrowsWithDetails,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Error in getMyBorrows:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách mượn sách'
        });
    }
};
exports.getMyBorrows = getMyBorrows;
/**
 * GET /api/borrows/me/current
 * Lấy số sách đang mượn và thông tin quyền mượn
 */
const getMyBorrowingInfo = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const info = await (0, borrowService_1.getBorrowingInfo)(userId);
        return res.status(200).json({ success: true, data: info });
    }
    catch (error) {
        console.error('Error in getMyBorrowingInfo:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thông tin mượn sách'
        });
    }
};
exports.getMyBorrowingInfo = getMyBorrowingInfo;
/**
 * POST /api/borrows/payment-link
 * Tạo payment link cho mượn lẻ
 */
const createRentalPayment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { bookId, rentalDays } = req.body;
        if (!bookId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID sách' });
        }
        if (!Number.isInteger(rentalDays)) {
            return res.status(400).json({ success: false, message: 'rentalDays là bắt buộc (1-7)' });
        }
        const payment = await (0, borrowService_1.createRentalPaymentLink)(userId, bookId, Number(rentalDays));
        return res.status(201).json({ success: true, data: { payment } });
    }
    catch (error) {
        console.error('Error in createRentalPayment:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Không thể tạo payment link'
        });
    }
};
exports.createRentalPayment = createRentalPayment;
/**
 * GET /api/borrows/:id
 * Lấy chi tiết một phiếu mượn
 */
const getBorrowById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const borrow = await Borrow_1.default.findById(id)
            .populate('book')
            .populate('user', 'fullName email');
        if (!borrow) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu mượn'
            });
        }
        // Kiểm tra quyền: user có thể là ObjectId hoặc đã được populate
        // Nếu đã populate, borrow.user là object có _id, nếu chưa thì là ObjectId
        const borrowUserId = borrow.user?._id
            ? String(borrow.user._id)
            : String(borrow.user);
        const isOwner = borrowUserId === userId;
        const isAdmin = req.user?.role === 'Admin' || req.user?.role === 'Librarian';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem phiếu mượn này'
            });
        }
        let daysLate = 0;
        if (borrow.status === 'Borrowed' || borrow.status === 'Overdue') {
            if (borrow.dueDate < new Date()) {
                daysLate = Math.floor((Date.now() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            }
        }
        else if (borrow.status === 'Returned' && borrow.returnDate) {
            daysLate = Math.floor((borrow.returnDate.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        const borrowObj = borrow.toObject();
        return res.status(200).json({
            success: true,
            data: {
                ...borrowObj,
                daysLate: Math.max(0, daysLate)
            }
        });
    }
    catch (error) {
        console.error('Error in getBorrowById:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy chi tiết phiếu mượn'
        });
    }
};
exports.getBorrowById = getBorrowById;
/**
 * POST /api/borrows/:id/request-return
 * Reader yêu cầu trả sách (Borrowed/Overdue -> ReturnRequested)
 */
const requestReturn = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { notes } = req.body;
        const borrow = await Borrow_1.default.findById(id).populate('book user');
        if (!borrow) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu mượn'
            });
        }
        // Kiểm tra quyền sở hữu
        const borrowUserId = String(borrow.user._id || borrow.user);
        if (borrowUserId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này'
            });
        }
        // Kiểm tra status hợp lệ
        if (borrow.status !== 'Borrowed' && borrow.status !== 'Overdue') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể yêu cầu trả sách đang mượn hoặc quá hạn'
            });
        }
        // Cập nhật status
        borrow.status = 'ReturnRequested';
        if (notes) {
            borrow.notes = notes;
        }
        await borrow.save();
        return res.status(200).json({
            success: true,
            message: 'Yêu cầu trả sách đã được gửi, vui lòng đến thư viện để trả sách',
            data: {
                borrow: {
                    id: borrow._id,
                    status: borrow.status,
                    notes: borrow.notes
                }
            }
        });
    }
    catch (error) {
        console.error('Error in requestReturn:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi yêu cầu trả sách'
        });
    }
};
exports.requestReturn = requestReturn;
/**
 * POST /api/borrows/:id/return
 * Librarian xác nhận trả sách (ReturnRequested/Borrowed/Overdue -> Returned)
 */
const returnBorrowedBook = async (req, res) => {
    try {
        const staffUserId = req.user?.userId;
        const staffRole = req.user?.role;
        const { id } = req.params;
        const { bookCondition, notes } = req.body;
        // Debug: log thông tin user
        console.log('Return book request:', {
            staffUserId,
            staffRole,
            borrowId: id,
            userFromReq: req.user
        });
        // Kiểm tra role trước khi gọi service
        if (!staffRole) {
            return res.status(403).json({
                success: false,
                message: 'Không tìm thấy thông tin quyền truy cập'
            });
        }
        // Admin/Librarian có thể trả sách của bất kỳ user nào
        const borrow = await (0, borrowService_1.returnBook)(id, staffUserId, staffRole, bookCondition, notes);
        return res.status(200).json({
            success: true,
            message: 'Trả sách thành công',
            data: {
                borrow: {
                    id: borrow._id,
                    returnDate: borrow.returnDate,
                    lateFee: borrow.lateFee,
                    damageFee: borrow.damageFee,
                    totalFee: borrow.lateFee + borrow.damageFee,
                    status: borrow.status
                }
            }
        });
    }
    catch (error) {
        console.error('Error in returnBorrowedBook:', error);
        const errorMessage = error.message || 'Lỗi khi trả sách';
        if (errorMessage.includes('không tồn tại') || errorMessage.includes('Không tìm thấy')) {
            return res.status(404).json({ success: false, message: errorMessage });
        }
        if (errorMessage.includes('không có quyền') || errorMessage.includes('Chỉ Admin/Librarian')) {
            return res.status(403).json({ success: false, message: errorMessage });
        }
        if (errorMessage.includes('đã được trả')) {
            return res.status(400).json({ success: false, message: errorMessage });
        }
        return res.status(500).json({ success: false, message: errorMessage });
    }
};
exports.returnBorrowedBook = returnBorrowedBook;
/**
 * POST /api/borrows/:id/renew
 * Gia hạn mượn sách
 */
const renewBorrowedBook = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const validation = await (0, borrowService_1.canRenewBorrow)(id, userId);
        if (!validation.canRenew) {
            return res.status(400).json({
                success: false,
                message: validation.reason || 'Không thể gia hạn'
            });
        }
        const borrow = await (0, borrowService_1.renewBorrow)(id, userId);
        return res.status(200).json({
            success: true,
            message: 'Gia hạn thành công',
            data: {
                borrow: {
                    id: borrow._id,
                    dueDate: borrow.dueDate,
                    renewalCount: borrow.renewalCount,
                    maxRenewals: borrow.maxRenewals
                }
            }
        });
    }
    catch (error) {
        console.error('Error in renewBorrowedBook:', error);
        if (error.message.includes('không tồn tại') || error.message.includes('Không tìm thấy')) {
            return res.status(404).json({ success: false, message: error.message });
        }
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi gia hạn'
        });
    }
};
exports.renewBorrowedBook = renewBorrowedBook;
/**
 * GET /api/borrows (Admin/Librarian only)
 * Lấy danh sách tất cả phiếu mượn
 */
const getAllBorrows = async (req, res) => {
    try {
        const { status, userId, bookId, page = 1, limit = 10, sort = 'borrowDate', order = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let query = {};
        if (status)
            query.status = status;
        if (userId)
            query.user = userId;
        if (bookId)
            query.book = bookId;
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortObj = {};
        sortObj[sort] = sortOrder;
        const borrows = await Borrow_1.default.find(query)
            .populate('book', 'title coverImage isbn')
            .populate('user', 'fullName email')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))
            .lean();
        // Filter out records where book or user is null (deleted references)
        const validBorrows = borrows.filter((b) => b.book && b.user);
        const total = await Borrow_1.default.countDocuments(query);
        return res.status(200).json({
            success: true,
            data: {
                borrows: validBorrows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Error in getAllBorrows:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách mượn sách'
        });
    }
};
exports.getAllBorrows = getAllBorrows;
/**
 * GET /api/borrows/history
 * Lấy lịch sử mượn của người dùng
 */
const listMyBorrowHistory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const borrows = await Borrow_1.default.find({ user: userId })
            .populate('book')
            .sort({ createdAt: -1 });
        return res.status(200).json({ borrows });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Failed to fetch borrow history', error: error.message });
    }
};
exports.listMyBorrowHistory = listMyBorrowHistory;
/**
 * POST /api/borrows/calculate-late-fees
 * Tính phạt trễ hạn tự động cho tất cả sách quá hạn
 * Chỉ dành cho Admin hoặc hệ thống
 */
const calculateLateFees = async (req, res) => {
    try {
        const result = await (0, borrowService_1.calculateLateFeesAutomatically)();
        return res.status(200).json({
            success: true,
            message: 'Tính phạt trễ hạn tự động thành công',
            data: {
                summary: {
                    totalProcessed: result.totalProcessed,
                    totalUpdated: result.totalUpdated,
                    totalLateFee: result.totalLateFee
                },
                details: result.details
            }
        });
    }
    catch (error) {
        console.error('Error in calculateLateFees:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tính phạt trễ hạn tự động'
        });
    }
};
exports.calculateLateFees = calculateLateFees;
/**
 * POST /api/borrows/:id/send-reminder
 * Gửi thông báo nhắc nhở thủ công cho một phiếu mượn (Admin/Librarian only)
 */
const sendReminderForBorrow = async (req, res) => {
    try {
        const { id } = req.params;
        const { customMessage } = req.body;
        const borrow = await Borrow_1.default.findById(id);
        if (!borrow) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu mượn'
            });
        }
        if (borrow.status === 'Returned') {
            return res.status(400).json({
                success: false,
                message: 'Không thể gửi nhắc nhở cho sách đã được trả'
            });
        }
        const result = await (0, emailService_1.sendManualReminderEmail)(id, customMessage);
        return res.status(200).json({
            success: true,
            message: 'Đã gửi thông báo nhắc nhở thành công',
            data: result
        });
    }
    catch (error) {
        console.error('Error in sendReminderForBorrow:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi gửi thông báo nhắc nhở'
        });
    }
};
exports.sendReminderForBorrow = sendReminderForBorrow;
/**
 * POST /api/borrows/:id/mark-lost
 * Staff đánh dấu sách là mất
 */
const markBookAsLost = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const staffId = req.user?.userId;
        // Check staff role
        const staff = await User_1.default.findById(staffId);
        if (!staff || (staff.role !== 'Admin' && staff.role !== 'Librarian')) {
            return res.status(403).json({
                success: false,
                message: 'Chỉ staff mới có quyền thực hiện'
            });
        }
        const session = await mongoose_1.default.startSession();
        try {
            let borrow;
            await session.withTransaction(async () => {
                borrow = await Borrow_1.default.findById(id).populate('book user').session(session);
                if (!borrow) {
                    throw new Error('Không tìm thấy phiếu mượn');
                }
                if (borrow.status === 'Returned' || borrow.status === 'Lost') {
                    throw new Error('Sách đã được trả hoặc đã đánh dấu mất rồi');
                }
                const book = borrow.book;
                if (!book) {
                    throw new Error('Không tìm thấy thông tin sách');
                }
                const lostCondition = borrowingConstants_1.BOOK_CONDITION.LOST;
                const damageFee = (0, borrowingConstants_1.calculateDamageFeeByCondition)(lostCondition, book.price);
                // Update borrow
                borrow.status = 'Lost';
                borrow.damageFee = damageFee;
                borrow.returnDate = new Date();
                borrow.processedBy = staffId;
                borrow.notes = notes || `Đánh dấu mất bởi staff ${staff.fullName}`;
                await borrow.save({ session });
                // Giảm stock (không tăng available vì sách đã mất)
                await Book_1.default.updateOne({ _id: borrow.book }, { $inc: { stock: -1 } }, { session });
                // Update user debt
                const user = await User_1.default.findById(borrow.user).session(session);
                if (user) {
                    user.debt = (user.debt || 0) + damageFee;
                    user.debtLastUpdated = new Date();
                    user.totalSpent += damageFee;
                    await user.save({ session });
                }
            });
            // Record violation (ngoài transaction)
            try {
                await (0, violationService_1.recordViolation)(borrow.user.toString(), 'Lost', borrow._id.toString(), 'High', `Đánh dấu mất bởi staff ${staff.fullName}`);
            }
            catch (error) {
                console.error('Failed to record violation:', error);
            }
            // Populate lại để trả về
            borrow = await Borrow_1.default.findById(id).populate('book user');
            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu sách là mất',
                data: {
                    borrow,
                    damageFee: borrow.damageFee,
                    bookCondition: borrowingConstants_1.BOOK_CONDITION.LOST
                }
            });
        }
        catch (error) {
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
    catch (error) {
        console.error('Error in markBookAsLost:', error);
        if (error.message.includes('không tồn tại') || error.message.includes('Không tìm thấy')) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes('đã được trả') || error.message.includes('đã đánh dấu')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi đánh dấu sách là mất'
        });
    }
};
exports.markBookAsLost = markBookAsLost;
/**
 * POST /api/borrows/send-reminders/batch
 * Gửi thông báo nhắc nhở cho nhiều phiếu mượn cùng lúc (Admin/Librarian only)
 */
const sendBatchReminders = async (req, res) => {
    try {
        const { borrowIds, customMessage } = req.body;
        if (!borrowIds || !Array.isArray(borrowIds) || borrowIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp danh sách ID phiếu mượn (borrowIds)'
            });
        }
        if (borrowIds.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Không thể gửi nhắc nhở cho quá 50 phiếu mượn cùng lúc'
            });
        }
        const results = {
            success: [],
            failed: []
        };
        for (const borrowId of borrowIds) {
            try {
                const borrow = await Borrow_1.default.findById(borrowId);
                if (!borrow) {
                    results.failed.push({ borrowId, error: 'Không tìm thấy phiếu mượn' });
                    continue;
                }
                if (borrow.status === 'Returned') {
                    results.failed.push({ borrowId, error: 'Sách đã được trả' });
                    continue;
                }
                const result = await (0, emailService_1.sendManualReminderEmail)(borrowId, customMessage);
                results.success.push(result);
            }
            catch (error) {
                results.failed.push({
                    borrowId,
                    error: error.message || 'Lỗi khi gửi email'
                });
            }
        }
        return res.status(200).json({
            success: true,
            message: `Đã gửi ${results.success.length}/${borrowIds.length} thông báo nhắc nhở`,
            data: {
                total: borrowIds.length,
                successCount: results.success.length,
                failedCount: results.failed.length,
                success: results.success,
                failed: results.failed
            }
        });
    }
    catch (error) {
        console.error('Error in sendBatchReminders:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi gửi thông báo nhắc nhở hàng loạt'
        });
    }
};
exports.sendBatchReminders = sendBatchReminders;
/**
 * POST /api/borrows/:id/mark-damaged
 * Staff đánh dấu sách bị hư hỏng
 */
const markBookAsDamaged = async (req, res) => {
    try {
        const { id } = req.params;
        const { damageLevel, notes } = req.body;
        const staffId = req.user?.userId;
        // Check staff role
        const staff = await User_1.default.findById(staffId);
        if (!staff || (staff.role !== 'Admin' && staff.role !== 'Librarian')) {
            return res.status(403).json({
                success: false,
                message: 'Chỉ staff mới có quyền thực hiện'
            });
        }
        const normalizedDamageLevel = (0, borrowingConstants_1.normalizeBookCondition)(damageLevel);
        const isAllowedDamageCondition = normalizedDamageLevel === borrowingConstants_1.BOOK_CONDITION.DAMAGED ||
            normalizedDamageLevel === borrowingConstants_1.BOOK_CONDITION.SEVERELY_DAMAGED;
        if (!damageLevel || !isAllowedDamageCondition) {
            return res.status(400).json({
                success: false,
                message: 'Mức độ hư hỏng không hợp lệ (Damaged hoặc SeverelyDamaged)'
            });
        }
        const session = await mongoose_1.default.startSession();
        try {
            let borrow;
            await session.withTransaction(async () => {
                borrow = await Borrow_1.default.findById(id).populate('book user').session(session);
                if (!borrow) {
                    throw new Error('Không tìm thấy phiếu mượn');
                }
                if (borrow.status === 'Returned' || borrow.status === 'Damaged' || borrow.status === 'Lost') {
                    throw new Error('Sách đã được xử lý rồi');
                }
                const book = borrow.book;
                if (!book) {
                    throw new Error('Không tìm thấy thông tin sách');
                }
                const damageFee = (0, borrowingConstants_1.calculateDamageFeeByCondition)(normalizedDamageLevel, book.price);
                // Update borrow
                borrow.status = 'Damaged';
                borrow.damageFee = damageFee;
                borrow.returnDate = new Date();
                borrow.processedBy = staffId;
                borrow.notes = notes || `Đánh dấu hư hỏng (${normalizedDamageLevel}) bởi staff ${staff.fullName}`;
                await borrow.save({ session });
                // Tăng available (sách vẫn còn, chỉ bị hỏng)
                await Book_1.default.updateOne({ _id: borrow.book }, { $inc: { available: 1 } }, { session });
                // Update user debt
                const user = await User_1.default.findById(borrow.user).session(session);
                if (user) {
                    user.debt = (user.debt || 0) + damageFee;
                    user.debtLastUpdated = new Date();
                    user.totalSpent += damageFee;
                    await user.save({ session });
                }
            });
            // Record violation (ngoài transaction)
            try {
                await (0, violationService_1.recordViolation)(borrow.user.toString(), 'Damaged', borrow._id.toString(), 'High', `Đánh dấu hư hỏng (${normalizedDamageLevel}) bởi staff ${staff.fullName}`);
            }
            catch (error) {
                console.error('Failed to record violation:', error);
            }
            // Populate lại để trả về
            borrow = await Borrow_1.default.findById(id).populate('book user');
            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu sách bị hư hỏng',
                data: {
                    borrow,
                    damageFee: borrow.damageFee,
                    damageLevel: normalizedDamageLevel
                }
            });
        }
        catch (error) {
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
    catch (error) {
        console.error('Error in markBookAsDamaged:', error);
        if (error.message.includes('không tồn tại') || error.message.includes('Không tìm thấy')) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes('đã được xử lý')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi đánh dấu sách bị hư hỏng'
        });
    }
};
exports.markBookAsDamaged = markBookAsDamaged;
/**
 * POST /api/borrows/:id/approve
 * Librarian chấp nhận yêu cầu mượn sách (Pending -> Borrowed)
 */
const approveBorrowRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const staffId = req.user?.userId;
        const borrow = await Borrow_1.default.findById(id).populate('book user');
        if (!borrow) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu mượn sách'
            });
        }
        if (borrow.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này đã được xử lý hoặc không ở trạng thái chờ'
            });
        }
        const book = borrow.book;
        const user = await User_1.default.findById(borrow.user).populate('membershipPlanId');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }
        // Kiểm tra sách còn available không
        if (book.available <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Sách hiện không còn trong kho'
            });
        }
        // Lấy borrowing rules dựa trên membership
        const membershipPlan = user.membershipPlanId;
        let borrowDays = 14; // Default
        let maxRenewals = 1; // Default
        if (membershipPlan) {
            if (membershipPlan.name === 'Premium') {
                borrowDays = 30;
                maxRenewals = 3;
            }
            else {
                borrowDays = 14;
                maxRenewals = 1;
            }
        }
        // Nếu là Rental, dùng rentalDays
        if (borrow.borrowType === 'Rental' && borrow.rentalDays) {
            borrowDays = borrow.rentalDays;
            maxRenewals = 0; // Rental không được gia hạn
        }
        // Cập nhật borrow
        borrow.status = 'Borrowed';
        borrow.borrowDate = new Date();
        borrow.dueDate = new Date(Date.now() + borrowDays * 24 * 60 * 60 * 1000);
        borrow.maxRenewals = maxRenewals;
        borrow.processedBy = staffId;
        await borrow.save();
        // Giảm số lượng available
        await Book_1.default.updateOne({ _id: borrow.book }, { $inc: { available: -1 } });
        // Gửi email thông báo cho user (optional)
        try {
            await (0, emailService_1.sendBorrowSuccessEmail)(borrow._id.toString());
        }
        catch (emailError) {
            console.error('Failed to send borrow success email:', emailError);
        }
        return res.status(200).json({
            success: true,
            message: 'Đã chấp nhận yêu cầu mượn sách',
            data: {
                borrow: {
                    id: borrow._id,
                    user: borrow.user,
                    book: borrow.book,
                    borrowDate: borrow.borrowDate,
                    dueDate: borrow.dueDate,
                    status: borrow.status,
                    borrowType: borrow.borrowType,
                    maxRenewals: borrow.maxRenewals
                }
            }
        });
    }
    catch (error) {
        console.error('Error in approveBorrowRequest:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi chấp nhận yêu cầu mượn sách'
        });
    }
};
exports.approveBorrowRequest = approveBorrowRequest;
/**
 * POST /api/borrows/:id/reject
 * Librarian từ chối yêu cầu mượn sách (Pending -> Cancelled)
 */
const rejectBorrowRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const staffId = req.user?.userId;
        const borrow = await Borrow_1.default.findById(id).populate('book user');
        if (!borrow) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu mượn sách'
            });
        }
        if (borrow.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này đã được xử lý hoặc không ở trạng thái chờ'
            });
        }
        // Cập nhật borrow
        borrow.status = 'Cancelled';
        borrow.notes = reason || 'Yêu cầu bị từ chối bởi thủ thư';
        borrow.processedBy = staffId;
        await borrow.save();
        return res.status(200).json({
            success: true,
            message: 'Đã từ chối yêu cầu mượn sách',
            data: {
                borrow: {
                    id: borrow._id,
                    status: borrow.status,
                    notes: borrow.notes
                }
            }
        });
    }
    catch (error) {
        console.error('Error in rejectBorrowRequest:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi từ chối yêu cầu mượn sách'
        });
    }
};
exports.rejectBorrowRequest = rejectBorrowRequest;
//# sourceMappingURL=borrowController.js.map