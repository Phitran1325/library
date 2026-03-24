"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectReservation = exports.adminListReservations = exports.cancelReservation = exports.listMyReservations = exports.createReservation = void 0;
const Reservation_1 = __importDefault(require("../models/Reservation"));
const Book_1 = __importDefault(require("../models/Book"));
const User_1 = __importDefault(require("../models/User"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
const emailService_1 = require("../services/emailService");
const borrowingConstants_1 = require("../utils/borrowingConstants");
const createReservation = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { bookId } = req.body;
        if (!bookId) {
            return res.status(400).json({ message: 'bookId is required' });
        }
        const book = await Book_1.default.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        // Check user membership
        const user = await User_1.default.findById(userId).populate('membershipPlanId');
        if (!user || !user.membershipPlanId) {
            return res.status(400).json({ message: 'Bạn chưa có gói thành viên' });
        }
        const membershipPlan = user.membershipPlanId;
        const membershipType = membershipPlan.name || borrowingConstants_1.MembershipType.STANDARD;
        const rules = (0, borrowingConstants_1.getBorrowingRules)(membershipType);
        // Không cho đặt trước nếu đang mượn cùng cuốn sách
        const activeBorrow = await Borrow_1.default.findOne({
            user: userId,
            book: bookId,
            status: { $in: ['Borrowed', 'Overdue'] }
        });
        if (activeBorrow) {
            return res.status(400).json({
                message: 'Bạn đang mượn cuốn sách này, không thể đặt trước'
            });
        }
        // Check số lượng reservation hiện tại
        const currentReservations = await Reservation_1.default.countDocuments({
            user: userId,
            status: 'Pending'
        });
        if (currentReservations >= rules.maxReservations) {
            return res.status(400).json({
                message: `Bạn đã đạt tối đa ${rules.maxReservations} lượt đặt trước. ` +
                    `Vui lòng hủy một đặt trước trước khi tạo mới.`
            });
        }
        // Prevent duplicate active reservations by the same user for the same book
        const existing = await Reservation_1.default.findOne({ user: userId, book: bookId, status: { $in: ['Pending'] } });
        if (existing) {
            return res.status(409).json({ message: 'You already have a pending reservation for this book' });
        }
        // Tính expiresAt dựa trên membership plan
        const expiresAt = new Date(Date.now() + rules.reservationHoldHours * 60 * 60 * 1000);
        const reservation = await Reservation_1.default.create({ user: userId, book: bookId, expiresAt });
        return res.status(201).json({ message: 'Reservation created', reservation });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to create reservation', error: error.message });
    }
};
exports.createReservation = createReservation;
const listMyReservations = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const reservations = await Reservation_1.default.find({ user: userId }).populate('book');
        return res.status(200).json({ reservations });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to fetch reservations', error: error.message });
    }
};
exports.listMyReservations = listMyReservations;
const cancelReservation = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { id } = req.params;
        const reservation = await Reservation_1.default.findOne({ _id: id, user: userId });
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        if (reservation.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending reservations can be cancelled' });
        }
        reservation.status = 'Cancelled';
        await reservation.save();
        return res.status(200).json({ message: 'Reservation cancelled', reservation });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to cancel reservation', error: error.message });
    }
};
exports.cancelReservation = cancelReservation;
const adminListReservations = async (_req, res) => {
    try {
        const reservations = await Reservation_1.default.find().populate('book').populate('user');
        return res.status(200).json({ reservations });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to fetch reservations', error: error.message });
    }
};
exports.adminListReservations = adminListReservations;
const rejectReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || String(reason).trim().length === 0) {
            return res.status(400).json({ message: 'Lý do từ chối là bắt buộc' });
        }
        const reservation = await Reservation_1.default.findById(id).populate('book').populate('user');
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        if (reservation.status !== 'Pending') {
            return res.status(400).json({ message: 'Chỉ có thể từ chối reservation ở trạng thái Pending' });
        }
        // Get librarian ID from request
        const librarianId = req.user?.userId;
        // Update status and reason
        reservation.status = 'Rejected';
        reservation.rejectionReason = reason;
        reservation.rejectedBy = librarianId;
        await reservation.save();
        // Notify user via email if possible
        const populatedUser = reservation.user;
        const populatedBook = reservation.book;
        if (populatedUser && populatedUser.email) {
            try {
                await (0, emailService_1.sendReservationRejectedEmail)(populatedUser.email, populatedBook?.title || 'Sách', reason);
            }
            catch (_mailErr) {
                // Không chặn response nếu email lỗi
            }
        }
        return res.status(200).json({
            message: 'Reservation đã bị từ chối',
            reservation,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to reject reservation', error: error.message });
    }
};
exports.rejectReservation = rejectReservation;
//# sourceMappingURL=reservationController.js.map